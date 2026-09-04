import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { trpc } from '../../lib/trpc';
import { useSeriesDetail } from '../hooks/useSeriesDetail';
import { Series, Chapter } from '../types';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  Bookmark,
  BookOpen,
  Sparkles,
  Lock,
  Check,
  Eye,
  AlertTriangle,
  Megaphone,
  BookText,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '@panelva/ui';
import { ContentAccessModal } from '../components/reader/ContentAccessModal';

interface SeriesDetailsScreenProps {
  series: Series | any;
  seriesId?: string;
  route?: { params?: { seriesId?: string } };
  sessionToken: string | null;
  sessionUser: any;
  dbUser: any;
  readingHistory?: any[];
  onBack: () => void;
  onSelectChapter: (chapter: Chapter, series: Series) => void;
  onViewCreatorProfile: (creatorProfileId: string) => void;
  onRequireAuth: () => void;
  onOpenWallet: () => void;
}

function SeriesDetailsSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 60, height: 20, backgroundColor: colors.surface, borderRadius: radius.sm }} />
        <View style={{ width: 140, height: 20, backgroundColor: colors.surface, borderRadius: radius.sm }} />
        <View style={{ width: 24, height: 24, backgroundColor: colors.surface, borderRadius: radius.full }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroLayout}>
          <View style={[styles.coverContainer, { backgroundColor: colors.surface }]} />
          <View style={{ flex: 1, gap: spacing.sm, justifyContent: 'space-between' }}>
            <View style={{ width: '40%', height: 20, backgroundColor: colors.surface, borderRadius: radius.full }} />
            <View style={{ width: '90%', height: 24, backgroundColor: colors.surface, borderRadius: radius.sm }} />
            <View style={{ width: '60%', height: 16, backgroundColor: colors.surface, borderRadius: radius.sm }} />
            <View style={{ width: '100%', height: 40, backgroundColor: colors.surface, borderRadius: radius.md }} />
          </View>
        </View>
        <Card style={{ height: 64, backgroundColor: colors.surface }} />
        <Card style={{ height: 96, backgroundColor: colors.surface }} />
        <View style={{ width: '100%', height: 48, backgroundColor: colors.surface, borderRadius: radius.md }} />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ height: 56, backgroundColor: colors.surface, borderRadius: radius.md }} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SeriesDetailsScreenInner({
  series: initialSeries,
  seriesId: propSeriesId,
  route,
  sessionToken,
  sessionUser,
  dbUser,
  readingHistory,
  onBack,
  onSelectChapter,
  onViewCreatorProfile,
  onRequireAuth,
  onOpenWallet,
}: SeriesDetailsScreenProps) {
  const effectiveSeriesId = propSeriesId || route?.params?.seriesId || initialSeries?.id;

  // 1. Fetch & Normalize Series Data via useSeriesDetail
  const {
    series: fetchedSeries,
    chapters: rawChapters,
    creator: fetchedCreator,
    isLoading,
    error,
    refetch,
  } = useSeriesDetail(effectiveSeriesId);

  // Consolidate series
  const activeSeries: Series = fetchedSeries || initialSeries || {
    id: effectiveSeriesId || 's-1',
    title: 'Series Details',
    genre: 'General',
    type: 'COMIC',
  };

  // Sort order for chapters
  const [sortAscending, setSortAscending] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Content Access Modal state
  const [accessModalVisible, setAccessModalVisible] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<Chapter | null>(null);
  const [accessType, setAccessType] = useState<'EARLY_ACCESS' | 'AD_SUPPORTED' | 'PREMIUM'>('AD_SUPPORTED');

  const isUuid =
    typeof effectiveSeriesId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveSeriesId);

  // 2. Fetch live follow status
  const { data: followData, refetch: refetchFollow } = (trpc.series.isFollowingSeries as any).useQuery(
    { seriesId: effectiveSeriesId },
    { enabled: !!sessionToken && !!effectiveSeriesId && isUuid, retry: false }
  );

  // Follow mutation
  const toggleFollowMutation = trpc.series.toggleFollowSeries.useMutation({
    onSuccess: () => {
      refetchFollow();
    },
    onError: (err) => Alert.alert('Follow Error', err.message),
  });

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const getStatusBadgeConfig = (
    status?: string | null
  ): { label: string; variant: 'success' | 'primary' | 'warning' | 'default' } => {
    switch (status?.toUpperCase()) {
      case 'ONGOING':
        return { label: 'Ongoing', variant: 'success' };
      case 'COMING_SOON':
        return { label: 'Coming Soon', variant: 'primary' };
      case 'HIATUS':
        return { label: 'Hiatus', variant: 'warning' };
      case 'SEASON_ENDED':
        return { label: 'Season Ended', variant: 'default' };
      case 'NEW_SEASON_COMING':
        return { label: 'New Season Coming', variant: 'primary' };
      default:
        return { label: status || 'Ongoing', variant: 'success' };
    }
  };

  const creatorId = activeSeries?.creatorId || activeSeries?.creator?.id || fetchedCreator?.id;
  const creatorPenName =
    activeSeries?.creator?.penName || activeSeries?.author || fetchedCreator?.penName || 'Creator';
  const creatorAvatarUrl = activeSeries?.creator?.user?.avatarUrl || fetchedCreator?.avatarUrl;
  const isVetted = activeSeries?.creator?.isVetted || fetchedCreator?.isVetted;

  const [selectedFormatType, setSelectedFormatType] = useState<'COMIC' | 'NOVEL'>('COMIC');

  // Auto-sync format state with current series
  useEffect(() => {
    if (activeSeries?.type) {
      setSelectedFormatType(activeSeries.type === 'NOVEL' ? 'NOVEL' : 'COMIC');
    }
  }, [activeSeries?.id, activeSeries?.type]);

  const hasLinkedFormat = !!(activeSeries?.linkedSeries || activeSeries?.linkedSeriesId);
  const comicSeries = activeSeries?.type === 'NOVEL' ? activeSeries?.linkedSeries : activeSeries;
  const novelSeries = activeSeries?.type === 'NOVEL' ? activeSeries : activeSeries?.linkedSeries;
  const currentDisplayedSeries =
    hasLinkedFormat && selectedFormatType === 'NOVEL'
      ? novelSeries || activeSeries
      : comicSeries || activeSeries;
  const currentRawChapters = currentDisplayedSeries?.chapters || rawChapters;

  // Normalized Chapters list sorted using natural hierarchical sorting
  const sortedChapters: Chapter[] = useMemo(() => {
    const list = Array.isArray(currentRawChapters) ? [...currentRawChapters] : [];
    return list.sort((a: any, b: any) => {
      const keyA = a.sortKey || String(a.chapterIndex || 0).padStart(6, '0');
      const keyB = b.sortKey || String(b.chapterIndex || 0).padStart(6, '0');
      return sortAscending ? keyA.localeCompare(keyB) : keyB.localeCompare(keyA);
    });
  }, [currentRawChapters, sortAscending]);

  // Saved Reading Progress for this format
  const savedProgress = useMemo(() => {
    if (!readingHistory || readingHistory.length === 0) return null;
    const targetId = currentDisplayedSeries?.id || activeSeries?.id;
    const match = readingHistory.find(
      (item: any) =>
        item.chapter?.seriesId === targetId ||
        item.seriesId === targetId ||
        item.chapter?.series?.title === currentDisplayedSeries?.title
    );
    if (!match) return null;
    return {
      chapterIndex: match.chapter?.chapterIndex || match.chapterIndex || 1,
      chapterId: match.chapterId || match.chapter?.id,
      progressPct: match.progressPct || 0,
      title: match.chapter?.title || `Chapter ${match.chapter?.chapterIndex || 1}`,
    };
  }, [readingHistory, currentDisplayedSeries?.id, currentDisplayedSeries?.title, activeSeries?.id]);

  const isFollowing = followData?.followed ?? false;
  const isSubscribed = dbUser?.subscription === 'PREMIUM' || dbUser?.subscription === 'PLUS';

  // Handle Sharing
  const handleShare = async () => {
    triggerHaptic();
    try {
      await Share.share({
        title: activeSeries?.title,
        message: `Check out "${activeSeries?.title}" by ${creatorPenName} on Panelva!\nhttps://panelva.com/series/${activeSeries?.id || ''}`,
      });
    } catch {}
  };

  // Handle Follow Toggle
  const handleToggleFollow = () => {
    triggerHaptic();
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    if (!isUuid) {
      Alert.alert('Follow', 'Follow status updated for this series.');
      return;
    }
    toggleFollowMutation.mutate({ seriesId: effectiveSeriesId });
  };

  // Handle Chapter Row Press
  const handleChapterPress = useCallback(
    (chapter: Chapter) => {
      triggerHaptic();
      const isPremium = dbUser?.subscription === 'PREMIUM';
      const isPlus = dbUser?.subscription === 'PLUS';

      // 1. Check Early Access System first
      if (chapter.isEarlyAccess) {
        if (isPremium) {
          // Instant access
        } else if (isPlus && chapter.earlyAccess?.isPlusAvailable) {
          // Plus access (+2h)
        } else {
          // Blocked by Early Access -> Show Upgrade Modal
          setPendingChapter(chapter);
          setAccessType('EARLY_ACCESS');
          setAccessModalVisible(true);
          return;
        }
      }

      // 2. Check Content Access Tier
      const tier = chapter.tier || 'FREE';

      if (tier === 'FREE' || isSubscribed) {
        onSelectChapter(chapter, currentDisplayedSeries || activeSeries);
        return;
      }

      if (tier === 'AD_SUPPORTED') {
        setPendingChapter(chapter);
        setAccessType('AD_SUPPORTED');
        setAccessModalVisible(true);
        return;
      }

      if (tier === 'PREMIUM') {
        setPendingChapter(chapter);
        setAccessType('PREMIUM');
        setAccessModalVisible(true);
        return;
      }

      onSelectChapter(chapter, currentDisplayedSeries || activeSeries);
    },
    [isSubscribed, dbUser, onSelectChapter, currentDisplayedSeries, activeSeries]
  );

  // Primary Action Button (Start Reading vs Continue Reading)
  const handlePrimaryActionPress = () => {
    triggerHaptic();
    if (sortedChapters.length === 0) {
      Alert.alert('No Chapters', 'There are no published chapters available for this series.');
      return;
    }

    if (savedProgress) {
      const ch =
        sortedChapters.find(
          (c) => c.id === savedProgress.chapterId || c.chapterIndex === savedProgress.chapterIndex
        ) || sortedChapters[0];
      handleChapterPress(ch);
    } else {
      const firstCh =
        sortedChapters.find((c) => c.tier === 'FREE' || c.chapterIndex === 1) || sortedChapters[0];
      handleChapterPress(firstCh);
    }
  };

  // Description text formatting
  const rawDescription =
    activeSeries?.description ||
    activeSeries?.synopsis ||
    activeSeries?.quote ||
    'In a world where magic and neon collide, an unexpected destiny unfolds. Follow this gripping story as alliances form, secrets unravel, and the ultimate struggle begins.';
  const shouldTruncateDesc = rawDescription.length > 140;
  const displayedDescription =
    shouldTruncateDesc && !isDescriptionExpanded
      ? `${rawDescription.slice(0, 140)}...`
      : rawDescription;

  const contentTypeLabel =
    activeSeries?.type === 'NOVEL'
      ? 'Novel'
      : activeSeries?.type === 'MANHWA' || activeSeries?.genre?.toUpperCase() === 'ACTION'
      ? 'Manhwa'
      : 'Comic';

  // Skeleton Loader (replaces ActivityIndicator spinner)
  if (isLoading && !activeSeries?.title) {
    return <SeriesDetailsSkeleton />;
  }

  // Error state
  if (error && !activeSeries?.title) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorCenterBox}>
          <AlertTriangle size={36} color={colors.danger} />
          <Text style={styles.errorTitle}>Failed to load series</Text>
          <Text style={styles.errorSubtitle}>{error.message}</Text>
          <Button title="Retry" variant="primary" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  // Chapter item renderer for FlatList
  const renderChapterItem = ({ item: ch }: { item: Chapter }) => {
    const tier = ch.tier || 'FREE';
    const isRead = savedProgress && ch.chapterIndex <= savedProgress.chapterIndex;
    const isCurrent = savedProgress && ch.chapterIndex === savedProgress.chapterIndex;

    let dateString = 'Recent';
    if (ch.createdAt) {
      const dt = new Date(ch.createdAt);
      dateString = isNaN(dt.getTime())
        ? 'Recent'
        : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    return (
      <TouchableOpacity
        style={[
          styles.chapterRow,
          {
            backgroundColor: isCurrent ? colors.surface : colors.card,
            borderColor: isCurrent ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleChapterPress(ch)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Chapter ${ch.chapterIndex}: ${ch.title}`}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text
              style={[
                styles.chapterNumberText,
                { color: isCurrent ? colors.primary : colors.text },
              ]}
            >
              Chapter {ch.chapterIndex}
            </Text>
            {isRead && (
              <View style={styles.readIndicator}>
                <Check size={12} color={colors.success} />
                <Text style={styles.readIndicatorText}>Read</Text>
              </View>
            )}
          </View>
          <Text style={styles.chapterTitleText} numberOfLines={1}>
            {ch.title || `Episode ${ch.chapterIndex}`}
          </Text>
          <Text style={styles.chapterDateText}>{dateString}</Text>
        </View>

        {/* Tier badge */}
        <View style={styles.tierBadgeRow}>
          {ch.isEarlyAccess ? (
            <Badge variant="primary" size="sm">
              {ch.earlyAccess?.isPlusAvailable
                ? `Plus (${ch.earlyAccess.freeWaitFormatted})`
                : `Early (${ch.earlyAccess?.plusWaitFormatted || '2h'})`}
            </Badge>
          ) : tier === 'FREE' ? (
            <Badge variant="success" size="sm">
              Free
            </Badge>
          ) : tier === 'AD_SUPPORTED' ? (
            <Badge variant="warning" size="sm">
              Ad
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              Locked
            </Badge>
          )}
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header (Back & Share) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
        >
          <ChevronLeft size={22} color={colors.text} />
          <Text style={styles.headerBackLabel}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerCenterTitle} numberOfLines={1}>
          {activeSeries?.title}
        </Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share series"
        >
          <Share2 size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {/* 2. Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.heroLayout}>
            {/* Series Cover Artwork */}
            <View style={styles.coverContainer}>
              {activeSeries?.coverUrl ? (
                <ExpoImage
                  source={{ uri: activeSeries.coverUrl }}
                  style={styles.coverImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <BookOpen size={36} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Metadata Column */}
            <View style={styles.heroMeta}>
              {/* Type Badge & Status */}
              <View style={styles.badgeRow}>
                <Badge variant="primary" size="sm">
                  {contentTypeLabel}
                </Badge>
                {(() => {
                  const stConfig = getStatusBadgeConfig(activeSeries?.status);
                  return (
                    <Badge variant={stConfig.variant} size="sm">
                      {stConfig.label}
                    </Badge>
                  );
                })()}
              </View>

              {/* Title */}
              <Text style={styles.titleText} numberOfLines={2}>
                {activeSeries?.title}
              </Text>

              {/* Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Star size={14} color={colors.warning} />
                  <Text style={styles.metricValue}>{activeSeries?.rating || '9.8'}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Eye size={14} color={colors.textMuted} />
                  <Text style={[styles.metricValue, { color: colors.textMuted }]}>
                    {activeSeries?.views || '120k'}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.genreText}>{activeSeries?.genre || 'Action'}</Text>
                </View>
              </View>

              {/* Follow Button using standard Button component */}
              <Button
                title={isFollowing ? 'Bookmarked' : 'Add to Library'}
                variant={isFollowing ? 'secondary' : 'primary'}
                onPress={handleToggleFollow}
              />
            </View>
          </View>
        </View>

        {/* Creator Status Announcement Banner (Megaphone icon, no emojis) */}
        {activeSeries?.statusMessage ? (
          <Card
            style={{
              marginHorizontal: spacing.md,
              marginTop: spacing.md,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
            }}
          >
            <Megaphone size={18} color={colors.warning} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={styles.announcementHeader}>Creator Status Notice</Text>
              <Text style={styles.announcementBody}>"{activeSeries.statusMessage}"</Text>
              {activeSeries.statusUpdatedAt ? (
                <Text style={styles.announcementDate}>
                  Updated {new Date(activeSeries.statusUpdatedAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* 3. Creator Card using universal Card */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            if (creatorId && onViewCreatorProfile) {
              onViewCreatorProfile(creatorId);
            }
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View ${creatorPenName}'s profile`}
          style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}
        >
          <Card style={styles.creatorCardContent}>
            <View style={styles.creatorAvatar}>
              {creatorAvatarUrl ? (
                <ExpoImage source={{ uri: creatorAvatarUrl }} style={styles.creatorAvatarImg} />
              ) : (
                <Text style={styles.creatorAvatarInitial}>
                  {creatorPenName[0]?.toUpperCase()}
                </Text>
              )}
            </View>

            <View style={{ flex: 1, gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Text style={styles.creatorName}>{creatorPenName}</Text>
                {isVetted && (
                  <View style={styles.vettedBadge}>
                    <Check size={10} color={colors.text} />
                  </View>
                )}
              </View>
              <Text style={styles.creatorSubtitle}>Original Creator • Tap for profile</Text>
            </View>

            <ChevronRight size={18} color={colors.textMuted} />
          </Card>
        </TouchableOpacity>

        {/* 4. Synopsis / Description using universal Card */}
        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.synopsisHeaderTitle}>Synopsis</Text>
            <Text style={styles.synopsisBodyText}>{displayedDescription}</Text>
            {shouldTruncateDesc && (
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic();
                  setIsDescriptionExpanded(!isDescriptionExpanded);
                }}
                style={{ alignSelf: 'flex-start', paddingTop: spacing.xs }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isDescriptionExpanded ? 'Read less synopsis' : 'Read more synopsis'}
              >
                <Text style={styles.readMoreText}>
                  {isDescriptionExpanded ? 'Read Less ▲' : 'Read More ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* 4.5 Available Formats (Shown ONLY if linked series exists) */}
        {hasLinkedFormat && (
          <View style={styles.formatSection}>
            <Text style={styles.formatSectionTitle}>Available Formats</Text>
            <View style={styles.formatCardsRow}>
              {/* Comic / Manhwa Card */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: selectedFormatType === 'COMIC' ? colors.surface : colors.card,
                    borderColor: selectedFormatType === 'COMIC' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFormatType('COMIC');
                }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedFormatType === 'COMIC' }}
                accessibilityLabel="Select comic or manhwa format"
              >
                <View style={styles.formatCardHeader}>
                  <BookOpen
                    size={16}
                    color={selectedFormatType === 'COMIC' ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.formatCardTitle,
                      { color: selectedFormatType === 'COMIC' ? colors.primary : colors.text },
                    ]}
                  >
                    Comic / Manhwa
                  </Text>
                </View>
                <Text style={styles.formatCardSubtitle}>Visual reading experience</Text>
              </TouchableOpacity>

              {/* Novel Card */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: selectedFormatType === 'NOVEL' ? colors.surface : colors.card,
                    borderColor: selectedFormatType === 'NOVEL' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFormatType('NOVEL');
                }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedFormatType === 'NOVEL' }}
                accessibilityLabel="Select novel text format"
              >
                <View style={styles.formatCardHeader}>
                  <BookText
                    size={16}
                    color={selectedFormatType === 'NOVEL' ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.formatCardTitle,
                      { color: selectedFormatType === 'NOVEL' ? colors.primary : colors.text },
                    ]}
                  >
                    Novel
                  </Text>
                </View>
                <Text style={styles.formatCardSubtitle}>Text reading experience</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 5. Primary Reading Action Banner */}
        <View style={styles.primaryActionSection}>
          <TouchableOpacity
            style={styles.primaryReadingBtn}
            onPress={handlePrimaryActionPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={savedProgress ? 'Continue Reading' : 'Start Reading'}
          >
            <BookOpen size={20} color={colors.text} />
            <View style={{ alignItems: 'center', gap: spacing.xs }}>
              <Text style={styles.primaryReadingBtnTitle}>
                {savedProgress ? 'Continue Reading' : 'Start Reading'}
              </Text>
              <Text style={styles.primaryReadingBtnSubtitle}>
                {savedProgress
                  ? `Chapter ${savedProgress.chapterIndex} • ${savedProgress.progressPct}% complete`
                  : sortedChapters[0]
                  ? `${sortedChapters[0].title} • ${sortedChapters[0].tier === 'FREE' ? 'Free Episode' : 'First Episode'}`
                  : 'Start from Chapter 1'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 6. Chapter List Section with FlatList */}
        <View style={styles.chaptersSection}>
          <View style={styles.chaptersHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={styles.chaptersSectionTitle}>Chapters</Text>
              <View style={styles.chapterCountBadge}>
                <Text style={styles.chapterCountText}>{sortedChapters.length}</Text>
              </View>
            </View>

            {/* Sort Toggle (1 → N vs N → 1) */}
            <TouchableOpacity
              style={styles.sortOrderBtn}
              onPress={() => {
                triggerHaptic();
                setSortAscending(!sortAscending);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Sort chapters ${sortAscending ? 'ascending' : 'descending'}`}
            >
              <Text style={styles.sortOrderText}>
                {sortAscending ? `1 → ${sortedChapters.length}` : `${sortedChapters.length} → 1`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chapter FlatList */}
          {sortedChapters.length > 0 ? (
            <View style={styles.chaptersListContainer}>
              <FlatList
                data={sortedChapters}
                renderItem={renderChapterItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={false}
              />
            </View>
          ) : (
            <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
              <Card style={styles.emptyChaptersCard}>
                <BookOpen size={32} color={colors.textMuted} />
                <Text style={styles.emptyChaptersTitle}>No Published Chapters</Text>
                <Text style={styles.emptyChaptersSubtitle}>
                  This series does not have any public chapters available right now.
                </Text>
                <View style={{ marginTop: spacing.sm }}>
                  <Button title="Refresh Chapters" variant="secondary" onPress={() => refetch()} />
                </View>
              </Card>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Content Access Modal */}
      <ContentAccessModal
        visible={accessModalVisible}
        onClose={() => setAccessModalVisible(false)}
        accessType={accessType}
        chapterIndex={pendingChapter?.chapterIndex || 1}
        chapterTitle={pendingChapter?.title}
        seriesTitle={activeSeries?.title || 'Series'}
        earlyAccessSchedule={pendingChapter?.earlyAccess}
        creditBalance={dbUser?.creditsBalance || dbUser?.wCoinBalance || 0}
        onUnlockWithCredits={() => {
          setAccessModalVisible(false);
          if (pendingChapter) {
            onSelectChapter(pendingChapter, activeSeries);
          }
        }}
        onWatchAd={() => {
          setAccessModalVisible(false);
          if (pendingChapter) {
            onSelectChapter(pendingChapter, activeSeries);
          }
        }}
        onOpenWallet={onOpenWallet}
        onRequireAuth={onRequireAuth}
        isAuthenticated={!!sessionToken}
      />
    </SafeAreaView>
  );
}

export function SeriesDetailsScreen(props: SeriesDetailsScreenProps) {
  return (
    <ErrorBoundary onReset={props.onBack}>
      <SeriesDetailsScreenInner {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    gap: spacing.xs,
    minHeight: 44,
  },
  headerBackLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  headerCenterTitle: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  heroContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroLayout: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coverContainer: {
    width: 112,
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  typeBadgeText: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  announcementHeader: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.warning,
  },
  announcementBody: {
    fontSize: typography.caption.fontSize,
    fontStyle: 'italic',
    lineHeight: typography.caption.lineHeight,
    color: colors.text,
  },
  announcementDate: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  titleText: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  genreText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  creatorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  creatorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  creatorAvatarInitial: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  creatorName: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  creatorSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  vettedBadge: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  synopsisHeaderTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  synopsisBodyText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  readMoreText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  primaryActionSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  primaryReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  primaryReadingBtnTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  primaryReadingBtnSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: typography.caption.fontSize,
  },
  chaptersSection: {
    marginTop: spacing.lg,
  },
  chaptersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  chaptersSectionTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  chapterCountBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  chapterCountText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sortOrderBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortOrderText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.primary,
  },
  chaptersListContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  chapterNumberText: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  readIndicatorText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.success,
  },
  chapterTitleText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  chapterDateText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  tierBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  emptyChaptersCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyChaptersTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    marginTop: spacing.xs,
    color: colors.text,
  },
  emptyChaptersSubtitle: {
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    color: colors.textMuted,
  },
  errorCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  errorSubtitle: {
    fontSize: typography.small.fontSize,
    textAlign: 'center',
    color: colors.textMuted,
  },
  formatSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  formatSectionTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  formatCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  formatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  formatCardTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  formatCardSubtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
});
