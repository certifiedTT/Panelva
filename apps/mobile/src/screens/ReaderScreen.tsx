import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { trpc } from '../../lib/trpc';
import { useSeriesDetail } from '../hooks/useSeriesDetail';
import { Series, Chapter } from '../types';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { AlertTriangle } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Button } from '../components/common/Button';
import { ReaderHeader } from '../components/reader/ReaderHeader';
import { ReaderProgressBar } from '../components/reader/ReaderProgressBar';
import { ComicReader } from '../components/reader/ComicReader';
import { NovelReader } from '../components/reader/NovelReader';
import { ChapterNavigation } from '../components/reader/ChapterNavigation';
import { ChapterCommentsModal } from '../components/reader/ChapterCommentsModal';
import { ContentAccessModal } from '../components/reader/ContentAccessModal';

export interface ReaderScreenProps {
  series?: Series | any;
  seriesId?: string;
  route?: { params?: { seriesId?: string; chapterId?: string; chapterIndex?: number; format?: string } };
  currentChapterIndex?: number;
  selectedChapterId?: string | null;
  sessionToken?: string | null;
  sessionUser?: any;
  dbUser?: any;
  onBack: () => void;
  onSelectChapter?: (chapter: Chapter) => void;
  onViewCreatorProfile?: (creatorProfileId: string) => void;
  onRequireAuth?: () => void;
  onOpenWallet?: () => void;
}

function ReaderSkeleton() {
  return (
    <SafeAreaView style={styles.skeletonContainer}>
      {/* Top Header Placeholder */}
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonBackBtn} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
        </View>
      </View>

      {/* Page Canvas Placeholders */}
      <View style={styles.skeletonCanvas}>
        <View style={styles.skeletonPageBlock} />
      </View>

      {/* Bottom Bar Placeholder */}
      <View style={styles.skeletonFooter}>
        <View style={styles.skeletonNavBtn} />
        <View style={styles.skeletonNavBtn} />
      </View>
    </SafeAreaView>
  );
}

/**
 * Inner Reader Screen coordinating modular sub-components.
 * Contains ZERO format-switching controls (format selection happens strictly on Series Details page).
 */
function ReaderScreenInner({
  series: passedSeries,
  seriesId: passedSeriesId,
  route,
  currentChapterIndex = 1,
  selectedChapterId,
  sessionToken,
  dbUser,
  onBack,
  onRequireAuth,
  onOpenWallet,
}: ReaderScreenProps) {
  // Resolve target series ID
  const effectiveSeriesId = passedSeriesId || route?.params?.seriesId || passedSeries?.id;
  const isUuid =
    typeof effectiveSeriesId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveSeriesId);

  // Fetch / normalize series details
  const {
    series: fetchedSeries,
    chapters: fetchedChapters,
    isLoading,
    error,
    refetch,
  } = useSeriesDetail(effectiveSeriesId);

  const activeSeries: Series = passedSeries || fetchedSeries || {
    id: effectiveSeriesId || 'series-default',
    title: 'Series Reader',
    type: route?.params?.format === 'novel' ? 'NOVEL' : 'COMIC',
  };

  const allChapters = fetchedChapters.length > 0 ? fetchedChapters : activeSeries.chapters || [];

  // Active Chapter Index State
  const initialIndex = route?.params?.chapterIndex || currentChapterIndex || 1;
  const [currentIdx, setCurrentIdx] = useState<number>(initialIndex);

  // Active Chapter
  const activeChapter: Chapter | null = useMemo(() => {
    if (selectedChapterId) {
      const match = allChapters.find((c) => c.id === selectedChapterId);
      if (match) return match;
    }
    const matchByIndex = allChapters.find((c) => c.chapterIndex === currentIdx);
    if (matchByIndex) return matchByIndex;
    return allChapters[0] || null;
  }, [allChapters, selectedChapterId, currentIdx]);

  // Controls UI visibility (toggle on tap)
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Modals state
  const [commentsVisible, setCommentsVisible] = useState<boolean>(false);
  const [accessModalVisible, setAccessModalVisible] = useState<boolean>(false);
  const [pendingChapter, setPendingChapter] = useState<Chapter | null>(null);
  const [accessType, setAccessType] = useState<'EARLY_ACCESS' | 'AD_SUPPORTED' | 'PREMIUM'>('AD_SUPPORTED');

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const isSubscribed = dbUser?.subscription === 'PREMIUM' || dbUser?.subscription === 'PLUS';

  // Bookmark / Follow mutation
  const { data: followData, refetch: refetchFollow } = (trpc.series.isFollowingSeries as any).useQuery(
    { seriesId: effectiveSeriesId },
    { enabled: !!sessionToken && !!effectiveSeriesId && isUuid, retry: false }
  );

  const toggleFollowMutation = trpc.series.toggleFollowSeries.useMutation({
    onSuccess: () => refetchFollow(),
    onError: (err) => Alert.alert('Bookmark Error', err.message),
  });

  const handleToggleBookmark = () => {
    triggerHaptic();
    if (!sessionToken) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (isUuid) {
      toggleFollowMutation.mutate({ seriesId: effectiveSeriesId });
    }
  };

  // Chapter Navigation bounds
  const sortedChapters = useMemo(() => {
    return [...allChapters].sort((a, b) => (a.chapterIndex || 0) - (b.chapterIndex || 0));
  }, [allChapters]);

  const currentChapterPos = sortedChapters.findIndex(
    (c) => c.chapterIndex === (activeChapter?.chapterIndex || currentIdx)
  );

  const prevChapter = currentChapterPos > 0 ? sortedChapters[currentChapterPos - 1] : null;
  const nextChapter =
    currentChapterPos < sortedChapters.length - 1 ? sortedChapters[currentChapterPos + 1] : null;

  // Chapter access validation helper
  const navigateToChapter = useCallback(
    (targetChapter: Chapter) => {
      triggerHaptic();
      const isPremium = dbUser?.subscription === 'PREMIUM';
      const isPlus = dbUser?.subscription === 'PLUS';

      // 1. Early Access Check
      if (targetChapter.isEarlyAccess) {
        if (isPremium) {
          // Allowed
        } else if (isPlus && targetChapter.earlyAccess?.isPlusAvailable) {
          // Allowed
        } else {
          setPendingChapter(targetChapter);
          setAccessType('EARLY_ACCESS');
          setAccessModalVisible(true);
          return;
        }
      }

      // 2. Content Tier Check
      const tier = targetChapter.tier || 'FREE';
      if (tier === 'FREE' || isSubscribed) {
        setCurrentIdx(targetChapter.chapterIndex);
        setScrollProgress(0);
        return;
      }

      if (tier === 'AD_SUPPORTED') {
        setPendingChapter(targetChapter);
        setAccessType('AD_SUPPORTED');
        setAccessModalVisible(true);
        return;
      }

      if (tier === 'PREMIUM') {
        setPendingChapter(targetChapter);
        setAccessType('PREMIUM');
        setAccessModalVisible(true);
        return;
      }

      setCurrentIdx(targetChapter.chapterIndex);
      setScrollProgress(0);
    },
    [dbUser, isSubscribed]
  );

  const handleNextChapter = () => {
    if (nextChapter) {
      navigateToChapter(nextChapter);
    }
  };

  const handlePrevChapter = () => {
    if (prevChapter) {
      navigateToChapter(prevChapter);
    }
  };

  // Loading Screen using skeleton loader
  if (isLoading && !activeSeries.title) {
    return <ReaderSkeleton />;
  }

  // Error Screen
  if (error && !activeSeries.title) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <AlertTriangle size={36} color={colors.danger} />
        <Text style={styles.errorTitle}>Unable to load chapter</Text>
        <Text style={styles.errorSubtitle}>{error.message}</Text>
        <View style={{ marginTop: spacing.md }}>
          <Button title="Retry" variant="primary" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const isNovelFormat = (activeSeries.type || '').toUpperCase() === 'NOVEL';
  const effectiveChapter = activeChapter || {
    id: 'ch-fallback',
    chapterIndex: currentIdx,
    title: `Chapter ${currentIdx}`,
    tier: 'FREE',
  };

  const normalizedPages = useMemo(() => {
    const raw = effectiveChapter.pages || [];
    return raw.map((p: any, idx: number) => {
      if (typeof p === 'string') {
        return { id: `p-${idx}`, imageUrl: p, pageIndex: idx };
      }
      return {
        id: p?.id || `p-${idx}`,
        imageUrl: p?.imageUrl || p?.url || '',
        pageIndex: typeof p?.pageIndex === 'number' ? p.pageIndex : idx,
        width: p?.width,
        height: p?.height,
      };
    });
  }, [effectiveChapter.pages]);

  return (
    <View style={[styles.container, { backgroundColor: isNovelFormat ? colors.background : colors.surface }]}>
      <StatusBar hidden={!isControlsVisible} barStyle="light-content" />

      {/* 1. Header (Minimal: Back, Chapter number, Series title - NO format switch) */}
      {isControlsVisible && (
        <ReaderHeader
          seriesTitle={activeSeries.title}
          chapterIndex={effectiveChapter.chapterIndex}
          chapterTitle={effectiveChapter.title}
          onBack={onBack}
        />
      )}

      {/* 2. Top Progress Bar */}
      <ReaderProgressBar progress={scrollProgress} />

      {/* 3. Reading Canvas (Comic or Novel based strictly on Series type) */}
      <View style={styles.canvasContainer}>
        {isNovelFormat ? (
          <NovelReader
            chapter={effectiveChapter}
            textContent={effectiveChapter.textContent || null}
            onScrollProgress={setScrollProgress}
            onToggleControls={() => setIsControlsVisible(!isControlsVisible)}
            onNextChapter={handleNextChapter}
            hasNextChapter={!!nextChapter}
            nextChapterTitle={nextChapter?.title}
          />
        ) : (
          <ComicReader
            chapter={effectiveChapter}
            pages={normalizedPages}
            onScrollProgress={setScrollProgress}
            onToggleControls={() => setIsControlsVisible(!isControlsVisible)}
            onNextChapter={handleNextChapter}
            hasNextChapter={!!nextChapter}
            nextChapterTitle={nextChapter?.title}
          />
        )}
      </View>

      {/* 4. Bottom Navigation Bar */}
      {isControlsVisible && (
        <ChapterNavigation
          progressPct={scrollProgress * 100}
          hasPrevChapter={!!prevChapter}
          hasNextChapter={!!nextChapter}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          onOpenComments={() => setCommentsVisible(true)}
          commentCount={effectiveChapter.commentCount || 0}
          isBookmarked={followData?.followed ?? false}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* 5. Chapter Comments Modal */}
      <ChapterCommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        chapterId={effectiveChapter.id}
        chapterIndex={effectiveChapter.chapterIndex}
        seriesTitle={activeSeries.title}
        sessionToken={sessionToken || null}
        dbUser={dbUser}
        onRequireAuth={onRequireAuth || (() => {})}
      />

      {/* 6. Content Access & Early Access Modal */}
      <ContentAccessModal
        visible={accessModalVisible}
        onClose={() => setAccessModalVisible(false)}
        accessType={accessType}
        chapterIndex={pendingChapter?.chapterIndex || currentIdx}
        chapterTitle={pendingChapter?.title}
        seriesTitle={activeSeries.title}
        earlyAccessSchedule={pendingChapter?.earlyAccess}
        creditBalance={dbUser?.creditsBalance || dbUser?.wCoinBalance || 0}
        onUnlockWithCredits={() => {
          setAccessModalVisible(false);
          if (pendingChapter) {
            setCurrentIdx(pendingChapter.chapterIndex);
            setScrollProgress(0);
          }
        }}
        onWatchAd={() => {
          setAccessModalVisible(false);
          if (pendingChapter) {
            setCurrentIdx(pendingChapter.chapterIndex);
            setScrollProgress(0);
          }
        }}
        onOpenWallet={onOpenWallet}
        onRequireAuth={onRequireAuth}
        isAuthenticated={!!sessionToken}
      />
    </View>
  );
}

export function ReaderScreen(props: ReaderScreenProps) {
  return (
    <ErrorBoundary onReset={props.onBack}>
      <ReaderScreenInner {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  skeletonHeader: {
    height: 56,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skeletonBackBtn: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  skeletonTitle: {
    width: '40%',
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  skeletonSubtitle: {
    width: '60%',
    height: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  skeletonCanvas: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonPageBlock: {
    width: '85%',
    height: '60%',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  skeletonFooter: {
    height: 64,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  skeletonNavBtn: {
    width: 64,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  errorSubtitle: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
