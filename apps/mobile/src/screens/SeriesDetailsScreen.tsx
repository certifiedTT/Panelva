import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Share,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { trpc } from '../../lib/trpc';
import { useSeriesDetail } from '../hooks/useSeriesDetail';
import { Series, Chapter, Creator } from '../types';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShareIcon,
  StarIcon,
  BookmarkIcon,
  BookOpenIcon,
  SparklesIcon,
  CrownIcon,
  LockIcon,
  CheckIcon,
  UsersIcon,
  EyeIcon,
  AlertTriangleIcon,
  NovelsIcon,
} from '../components/common/Icons';
import { ContentAccessModal } from '../components/reader/ContentAccessModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { colors } = useTheme();

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

  const isUuid = typeof effectiveSeriesId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveSeriesId);

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

  const getStatusBadgeConfig = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'ONGOING':
        return { label: 'Ongoing', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'COMING_SOON':
        return { label: 'Coming Soon', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'HIATUS':
        return { label: 'Hiatus', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' };
      case 'SEASON_ENDED':
        return { label: 'Season Ended', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', border: 'rgba(156, 163, 175, 0.3)' };
      case 'NEW_SEASON_COMING':
        return { label: 'New Season Coming', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.3)' };
      default:
        return { label: status || 'Ongoing', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    }
  };

  const creatorId = activeSeries?.creatorId || activeSeries?.creator?.id || fetchedCreator?.id;
  const creatorPenName = activeSeries?.creator?.penName || activeSeries?.author || fetchedCreator?.penName || 'Creator';
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
  const currentDisplayedSeries = (hasLinkedFormat && selectedFormatType === 'NOVEL')
    ? (novelSeries || activeSeries)
    : (comicSeries || activeSeries);
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
  const handleChapterPress = useCallback((chapter: Chapter) => {
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
  }, [isSubscribed, dbUser, onSelectChapter, currentDisplayedSeries, activeSeries]);

  // Primary Action Button (Start Reading vs Continue Reading)
  const handlePrimaryActionPress = () => {
    triggerHaptic();
    if (sortedChapters.length === 0) {
      Alert.alert('No Chapters', 'There are no published chapters available for this series.');
      return;
    }

    if (savedProgress) {
      const ch = sortedChapters.find((c) => c.id === savedProgress.chapterId || c.chapterIndex === savedProgress.chapterIndex) || sortedChapters[0];
      handleChapterPress(ch);
    } else {
      // Find first readable free chapter
      const firstCh = sortedChapters.find((c) => c.tier === 'FREE' || c.chapterIndex === 1) || sortedChapters[0];
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

  // Loading state
  if (isLoading && !activeSeries?.title) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingCenterBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading series details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !activeSeries?.title) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingCenterBox}>
          <AlertTriangleIcon size={36} color="#EF4444" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Failed to load series</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textMuted }]}>{error.message}</Text>
          <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.primaryActionBtnText}>Retry</Text>
          </TouchableOpacity>
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
      dateString = isNaN(dt.getTime()) ? 'Recent' : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    return (
      <TouchableOpacity
        style={[
          styles.chapterRow,
          {
            backgroundColor: isCurrent ? colors.primaryMuted : colors.surfaceElevated,
            borderColor: isCurrent ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleChapterPress(ch)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Chapter ${ch.chapterIndex}: ${ch.title}`}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.chapterNumberText, { color: isCurrent ? colors.primary : colors.text }]}>
              Chapter {ch.chapterIndex}
            </Text>
            {isRead && (
              <View style={[styles.readIndicator, { backgroundColor: colors.successMuted }]}>
                <CheckIcon size={10} color={colors.success} />
                <Text style={[styles.readIndicatorText, { color: colors.success }]}>Read</Text>
              </View>
            )}
          </View>
          <Text style={[styles.chapterTitleText, { color: colors.textSecondary }]} numberOfLines={1}>
            {ch.title || `Episode ${ch.chapterIndex}`}
          </Text>
          <Text style={[styles.chapterDateText, { color: colors.textMuted }]}>
            {dateString}
          </Text>
        </View>

        {/* Tier badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {ch.isEarlyAccess ? (
            <View style={[styles.tierBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <SparklesIcon size={12} color="#3B82F6" />
              <Text style={[styles.tierBadgeText, { color: '#3B82F6' }]}>
                {ch.earlyAccess?.isPlusAvailable
                  ? `Plus (Free in ${ch.earlyAccess.freeWaitFormatted})`
                  : `Early Access (${ch.earlyAccess?.plusWaitFormatted || '2h'})`}
              </Text>
            </View>
          ) : tier === 'FREE' ? (
            <View style={[styles.tierBadge, { backgroundColor: colors.successMuted }]}>
              <Text style={[styles.tierBadgeText, { color: colors.success }]}>Free</Text>
            </View>
          ) : tier === 'AD_SUPPORTED' ? (
            <View style={[styles.tierBadge, { backgroundColor: colors.warningMuted }]}>
              <SparklesIcon size={12} color={colors.warning} />
              <Text style={[styles.tierBadgeText, { color: colors.warning }]}>Ad</Text>
            </View>
          ) : (
            <View style={[styles.tierBadge, { backgroundColor: colors.errorMuted }]}>
              <LockIcon size={12} color={colors.error} />
              <Text style={[styles.tierBadgeText, { color: colors.error }]}>Locked</Text>
            </View>
          )}
          <ChevronRightIcon size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 1. Header (Back & Share) */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to previous screen"
        >
          <ChevronLeftIcon size={22} color={colors.text} />
          <Text style={[styles.headerBackLabel, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.headerCenterTitle, { color: colors.text }]} numberOfLines={1}>
          {activeSeries?.title}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityLabel="Share series"
        >
          <ShareIcon size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Section */}
        <View style={[styles.heroContainer, { borderBottomColor: colors.borderSubtle }]}>
          <View style={styles.heroLayout}>
            {/* Series Cover Artwork */}
            <View style={[styles.coverContainer, { backgroundColor: activeSeries?.coverBg || '#1A1A2E', borderColor: colors.border }]}>
              {activeSeries?.coverUrl ? (
                <ExpoImage
                  source={{ uri: activeSeries.coverUrl }}
                  style={styles.coverImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <BookOpenIcon size={36} color={colors.primary} />
                </View>
              )}
            </View>

            {/* Metadata Column */}
            <View style={styles.heroMeta}>
              {/* Type Badge & Status */}
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.typeBadgeText}>{contentTypeLabel}</Text>
                </View>
                {(() => {
                  const stConfig = getStatusBadgeConfig(activeSeries?.status);
                  return (
                    <View style={[styles.statusBadgePill, { backgroundColor: stConfig.bg, borderColor: stConfig.border }]}>
                      <View style={[styles.statusDot, { backgroundColor: stConfig.color }]} />
                      <Text style={[styles.statusPillText, { color: stConfig.color }]}>
                        {stConfig.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* Title */}
              <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={2}>
                {activeSeries?.title}
              </Text>

              {/* Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <StarIcon size={14} color={colors.accentGold} />
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {activeSeries?.rating || '9.8'}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <EyeIcon size={14} color={colors.textMuted} />
                  <Text style={[styles.metricValue, { color: colors.textMuted }]}>
                    {activeSeries?.views || '120k'}
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={[styles.genreText, { color: colors.primary }]}>
                    {activeSeries?.genre || 'Action'}
                  </Text>
                </View>
              </View>

              {/* Follow Button */}
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  {
                    backgroundColor: isFollowing ? colors.surfaceElevated : colors.primary,
                    borderColor: isFollowing ? colors.primary : colors.primaryDark,
                  },
                ]}
                onPress={handleToggleFollow}
                activeOpacity={0.8}
              >
                <BookmarkIcon size={14} color={isFollowing ? colors.primary : '#FFFFFF'} />
                <Text style={[styles.followBtnText, { color: isFollowing ? colors.primary : '#FFFFFF' }]}>
                  {isFollowing ? 'Bookmarked' : 'Add to Library'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Creator Status Announcement Banner (if set) */}
        {activeSeries?.statusMessage ? (
          <View style={[styles.statusAnnouncementCard, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
            <Text style={styles.announcementEmoji}>📢</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.announcementHeader, { color: colors.accentGold || '#fbbf24' }]}>
                Creator Status Notice
              </Text>
              <Text style={[styles.announcementBody, { color: colors.text }]}>
                "{activeSeries.statusMessage}"
              </Text>
              {activeSeries.statusUpdatedAt ? (
                <Text style={[styles.announcementDate, { color: colors.textMuted }]}>
                  Updated {new Date(activeSeries.statusUpdatedAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 3. Creator Card */}
        <TouchableOpacity
          style={[styles.creatorCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={() => {
            triggerHaptic();
            if (creatorId && onViewCreatorProfile) {
              onViewCreatorProfile(creatorId);
            }
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View ${creatorPenName}'s profile`}
        >
          <View style={[styles.creatorAvatar, { backgroundColor: colors.primaryMuted }]}>
            {creatorAvatarUrl ? (
              <ExpoImage source={{ uri: creatorAvatarUrl }} style={styles.creatorAvatarImg} />
            ) : (
              <Text style={[styles.creatorAvatarInitial, { color: colors.primary }]}>
                {creatorPenName[0]?.toUpperCase()}
              </Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.creatorName, { color: colors.text }]}>{creatorPenName}</Text>
              {isVetted && (
                <View style={[styles.vettedBadge, { backgroundColor: colors.primary }]}>
                  <CheckIcon size={10} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={[styles.creatorSubtitle, { color: colors.textMuted }]}>Original Creator • Tap for profile</Text>
          </View>

          <ChevronRightIcon size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* 4. Synopsis / Description */}
        <View style={[styles.synopsisCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.synopsisHeaderTitle, { color: colors.text }]}>Synopsis</Text>
          <Text style={[styles.synopsisBodyText, { color: colors.textSecondary }]}>
            {displayedDescription}
          </Text>
          {shouldTruncateDesc && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
              style={{ marginTop: 6 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.readMoreText, { color: colors.primary }]}>
                {isDescriptionExpanded ? 'Read Less ▲' : 'Read More ▼'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4.5 Available Formats (Shown ONLY if linked series exists) */}
        {hasLinkedFormat && (
          <View style={styles.formatSection}>
            <Text style={[styles.formatSectionTitle, { color: colors.text }]}>Available Formats</Text>
            <View style={styles.formatCardsRow}>
              {/* Comic / Manhwa Card */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: selectedFormatType === 'COMIC' ? 'rgba(37, 99, 235, 0.12)' : colors.surfaceElevated,
                    borderColor: selectedFormatType === 'COMIC' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFormatType('COMIC');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.formatCardHeader}>
                  <BookOpenIcon size={16} color={selectedFormatType === 'COMIC' ? colors.primary : colors.textMuted} />
                  <Text style={[styles.formatCardTitle, { color: selectedFormatType === 'COMIC' ? colors.primary : colors.text }]}>
                    Comic / Manhwa
                  </Text>
                </View>
                <Text style={[styles.formatCardSubtitle, { color: colors.textMuted }]}>
                  Visual reading experience
                </Text>
              </TouchableOpacity>

              {/* Novel Card */}
              <TouchableOpacity
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: selectedFormatType === 'NOVEL' ? 'rgba(37, 99, 235, 0.12)' : colors.surfaceElevated,
                    borderColor: selectedFormatType === 'NOVEL' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFormatType('NOVEL');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.formatCardHeader}>
                  <NovelsIcon size={16} color={selectedFormatType === 'NOVEL' ? colors.primary : colors.textMuted} />
                  <Text style={[styles.formatCardTitle, { color: selectedFormatType === 'NOVEL' ? colors.primary : colors.text }]}>
                    Novel
                  </Text>
                </View>
                <Text style={[styles.formatCardSubtitle, { color: colors.textMuted }]}>
                  Text reading experience
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 5. Primary Reading Action Banner */}
        <View style={styles.primaryActionSection}>
          <TouchableOpacity
            style={[styles.primaryReadingBtn, { backgroundColor: colors.primary }]}
            onPress={handlePrimaryActionPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={savedProgress ? 'Continue Reading' : 'Start Reading'}
          >
            <BookOpenIcon size={20} color="#FFFFFF" />
            <View style={{ alignItems: 'center' }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.chaptersSectionTitle, { color: colors.text }]}>Chapters</Text>
              <View style={[styles.chapterCountBadge, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.chapterCountText, { color: colors.textSecondary }]}>
                  {sortedChapters.length}
                </Text>
              </View>
            </View>

            {/* Sort Toggle (1 → N vs N → 1) */}
            <TouchableOpacity
              style={[styles.sortOrderBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => {
                triggerHaptic();
                setSortAscending(!sortAscending);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortOrderText, { color: colors.primary }]}>
                {sortAscending ? '1 → ' + sortedChapters.length : sortedChapters.length + ' → 1'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chapter FlatList */}
          {sortedChapters.length > 0 ? (
            <View style={{ gap: 8, marginTop: 12, paddingHorizontal: 16 }}>
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
            <View style={[styles.emptyChaptersBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <BookOpenIcon size={32} color={colors.textMuted} />
              <Text style={[styles.emptyChaptersTitle, { color: colors.text }]}>No Published Chapters</Text>
              <Text style={[styles.emptyChaptersSubtitle, { color: colors.textMuted }]}>
                This series does not have any public chapters available right now.
              </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
  },
  headerBackLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerCenterTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  heroContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  heroLayout: {
    flexDirection: 'row',
    gap: 16,
  },
  coverContainer: {
    width: 110,
    height: 155,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
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
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadgeText: {
    fontSize: 12,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusAnnouncementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  announcementEmoji: {
    fontSize: 18,
  },
  announcementHeader: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  announcementBody: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 2,
  },
  announcementDate: {
    fontSize: 10,
    marginTop: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginVertical: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 6,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  creatorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  creatorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  creatorAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  creatorSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  vettedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  synopsisCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  synopsisHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  synopsisBodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  primaryReadingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryReadingBtnTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryReadingBtnSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  chaptersSection: {
    marginTop: 20,
  },
  chaptersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  chaptersSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  chapterCountBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  chapterCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortOrderBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortOrderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    gap: 3,
  },
  readIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chapterTitleText: {
    fontSize: 13,
    marginTop: 2,
  },
  chapterDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyChaptersBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyChaptersTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyChaptersSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  loadingCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  primaryActionBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  formatSection: {
    marginHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  formatSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  formatCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  formatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  formatCardSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
});
