import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Badge, Card, Button } from '@panelva/ui';
import {
  ArrowLeft,
  Share2,
  BookOpen,
  MessageSquare,
  Info,
  Clock,
  Sparkles,
  Flame,
  Award,
  Heart,
  Eye,
  Calendar,
  Check,
  CheckCircle,
  Coins,
  Shield,
  FileText,
  Activity,
} from 'lucide-react-native';
import { isCreatorRole, isAdminRole, getRoleDisplayName } from '../data/mockRoles';

interface ProfileScreenProps {
  sessionToken: string | null;
  sessionUser: any;
  dbUser: any;
  onBack: () => void;
  onEditProfile?: () => void;
  onSelectSeries?: (series: any) => void;
}

type ProfileTabId = 'series' | 'posts' | 'about' | 'activity';

export function ProfileScreen({
  sessionToken,
  sessionUser,
  dbUser,
  onBack,
  onEditProfile,
  onSelectSeries,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('series');

  const username = dbUser?.username || sessionUser?.username || 'User';
  const displayName = dbUser?.displayName || dbUser?.name || username;
  const role = (dbUser?.role || sessionUser?.role || 'USER').toUpperCase();

  const isCreator = isCreatorRole(role);
  const isAdmin = isAdminRole(role);
  const isStudio = role === 'STUDIO';
  const isReader = !isCreator && !isAdmin && !isStudio;

  const subscriptionTier = dbUser?.subscription || 'NONE';
  const bio =
    dbUser?.bio ||
    (isCreator
      ? 'Digital comic creator and illustrator producing weekly fantasy webtoons.'
      : isStudio
      ? 'Collaborative webcomic production studio releasing serial narrative arcs.'
      : isAdmin
      ? 'Platform security and editorial operations administrator.'
      : 'Passionate webcomic enthusiast, fantasy novel reader, and active community member.');

  // Statistics counters
  const followingCount = dbUser?.followingCount || 42;
  const followersCount = dbUser?.followersCount || 128;
  const totalReadsCount = dbUser?.totalReads || 384;
  const reputation = dbUser?.reputationPoints || 145;

  // Streak & Streak Recovery System
  const [streak, setStreak] = useState<number>(5);
  const [brokenStreak, setBrokenStreak] = useState<number>(20);
  const [isStreakRecoverable, setIsStreakRecoverable] = useState<boolean>(true);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [creditBalance, setCreditBalance] = useState<number>(
    dbUser?.creditsBalance || dbUser?.wCoinBalance || 350
  );

  // Subscription perk: Premium gets 3 restore tokens, Plus gets 2 restore tokens, Free gets 1 restore token
  const initialRestoreTokens = 
    subscriptionTier === 'PREMIUM' ? 3 : 
    subscriptionTier === 'PLUS' ? 2 : 1;
  const [restoreTokens, setRestoreTokens] = useState<number>(initialRestoreTokens);

  const STREAK_RECOVERY_COST = 20;

  const handleRestoreStreak = (useToken = false) => {
    if (useToken && restoreTokens > 0) {
      setIsRestoring(true);
      setTimeout(() => {
        setRestoreTokens((prev) => prev - 1);
        setStreak(brokenStreak);
        setIsStreakRecoverable(false);
        setIsRestoring(false);
        Alert.alert(
          'Streak Restored! 🔥',
          `Your ${brokenStreak} day reading streak was restored using 1 restore token! (${restoreTokens - 1} token remaining)`
        );
      }, 600);
      return;
    }

    // Credits recovery: 20 Credits to platform only (master-admin account)
    if (creditBalance < STREAK_RECOVERY_COST) {
      Alert.alert(
        'Insufficient Credits',
        `You need ${STREAK_RECOVERY_COST} Credits to restore your streak. Please recharge your wallet.`
      );
      return;
    }

    setIsRestoring(true);
    setTimeout(() => {
      setCreditBalance((prev) => prev - STREAK_RECOVERY_COST);
      setStreak(brokenStreak);
      setIsStreakRecoverable(false);
      setIsRestoring(false);
      Alert.alert(
        'Streak Restored! 🔥',
        `Your ${brokenStreak} day reading streak has been restored! ${STREAK_RECOVERY_COST} Credits were transferred to the platform only (master-admin account).`
      );
    }, 600);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${displayName}'s (@${username}) profile on Panelva!`,
        url: `https://panelva.com/profile/${username}`,
      });
    } catch {
      Alert.alert('Share', `Profile link: https://panelva.com/profile/${username}`);
    }
  };

  // Dynamic Navigation Tabs Configuration
  interface TabConfig {
    id: ProfileTabId;
    label: string;
    icon: any;
  }

  const getTabsForRole = (): TabConfig[] => {
    if (isReader) {
      return [
        { id: 'series', label: 'Favorites', icon: BookOpen },
        { id: 'about', label: 'About', icon: Info },
        { id: 'activity', label: 'Activity', icon: Clock },
      ];
    }
    if (isCreator) {
      return [
        { id: 'series', label: 'Published', icon: BookOpen },
        { id: 'posts', label: 'Posts', icon: MessageSquare },
        { id: 'about', label: 'About', icon: Info },
        { id: 'activity', label: 'Publishing', icon: Clock },
      ];
    }
    if (isStudio) {
      return [
        { id: 'series', label: 'Studio Projects', icon: BookOpen },
        { id: 'posts', label: 'Posts', icon: MessageSquare },
        { id: 'about', label: 'About', icon: Info },
        { id: 'activity', label: 'Team Activity', icon: Clock },
      ];
    }
    // Admin
    return [
      { id: 'series', label: 'Managed Content', icon: BookOpen },
      { id: 'about', label: 'About', icon: Info },
      { id: 'activity', label: 'Admin Logs', icon: Clock },
    ];
  };

  const visibleTabs = getTabsForRole();

  // Safety fallback if activeTab isn't in visibleTabs
  const currentTabId = visibleTabs.some((t) => t.id === activeTab)
    ? activeTab
    : visibleTabs[0].id;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityLabel="Share profile"
        >
          <Share2 size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner with Avatar Overlay */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerBackground}>
            <View style={styles.bannerDecorCircle} />
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Identity & Metadata Section */}
        <View style={styles.profileMetaContainer}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Badge
              variant={isCreator ? 'success' : isAdmin ? 'danger' : 'primary'}
              size="sm"
            >
              {getRoleDisplayName(role).toUpperCase()}
            </Badge>
            {subscriptionTier !== 'NONE' && (
              <Badge
                variant={subscriptionTier === 'PREMIUM' ? 'warning' : 'primary'}
                size="sm"
              >
                {subscriptionTier}
              </Badge>
            )}
          </View>

          <Text style={styles.usernameText}>@{username}</Text>
          <Text style={styles.bioText}>{bio}</Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Button
              title="Edit Profile"
              variant="secondary"
              onPress={
                onEditProfile ||
                (() => Alert.alert('Edit Profile', 'Profile settings are up to date.'))
              }
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={styles.shareSquareButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row - Dynamically rendered per user role */}
        <View style={styles.statsRow}>
          {isReader ? (
            <>
              {/* Reader: 42 Following */}
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </Card>

              {/* Reader: Flame 5 Streak */}
              <Card style={styles.statCard}>
                <View style={styles.streakNumberRow}>
                  <Flame size={20} color="#f97316" />
                  <Text style={styles.statNumber}>{streak}</Text>
                </View>
                <Text style={styles.statLabel}>Streak</Text>
              </Card>

              {/* Reader: 384 Reads */}
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{totalReadsCount}</Text>
                <Text style={styles.statLabel}>Reads</Text>
              </Card>
            </>
          ) : isCreator ? (
            <>
              {/* Creator: Followers, Following, Published */}
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Published</Text>
              </Card>
            </>
          ) : isStudio ? (
            <>
              {/* Studio: Followers, Following, Projects */}
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>Projects</Text>
              </Card>
            </>
          ) : (
            <>
              {/* Admin: Audit Actions, Queued Reports, Managed Content */}
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>128</Text>
                <Text style={styles.statLabel}>Audit Logs</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Queued</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={styles.statNumber}>84</Text>
                <Text style={styles.statLabel}>Managed</Text>
              </Card>
            </>
          )}
        </View>

        {/* Streak Recovery System Card (Readers only, when eligible within 24h) */}
        {isReader && isStreakRecoverable && (
          <View style={styles.recoveryContainer}>
            <Card style={styles.recoveryCard}>
              <View style={styles.recoveryHeaderRow}>
                <View style={styles.recoveryTitleRow}>
                  <Flame size={18} color="#f97316" />
                  <Text style={styles.recoveryTitle}>Streak Recovery</Text>
                </View>
                <View style={styles.recoveryBadge}>
                  <Clock size={12} color={colors.warning} />
                  <Text style={styles.recoveryBadgeText}>24h window</Text>
                </View>
              </View>

              <Text style={styles.recoveryDesc}>
                Your {brokenStreak} day streak expired yesterday. Restore it within 24 hours.
              </Text>

              {restoreTokens > 0 ? (
                <View style={styles.recoveryTokenNotice}>
                  <Sparkles size={13} color="#f59e0b" />
                  <Text style={styles.recoveryTokenNoticeText}>
                    {restoreTokens} Restore Token{restoreTokens > 1 ? 's' : ''} available ({subscriptionTier === 'PREMIUM' ? 'Premium: 3 tokens' : subscriptionTier === 'PLUS' ? 'Panelva Plus: 2 tokens' : 'Free: 1 token'})
                  </Text>
                </View>
              ) : (
                <Text style={styles.recoveryPlatformNote}>
                  20 Credits fee goes strictly to the platform (master-admin account).
                </Text>
              )}

              <View style={styles.recoveryActionRow}>
                <View style={styles.recoveryCostBadge}>
                  {restoreTokens > 0 ? (
                    <>
                      <Sparkles size={14} color="#f59e0b" />
                      <Text style={styles.recoveryCostText}>1 Token (Free)</Text>
                    </>
                  ) : (
                    <>
                      <Coins size={14} color="#f59e0b" />
                      <Text style={styles.recoveryCostText}>
                        {STREAK_RECOVERY_COST} Credits
                      </Text>
                    </>
                  )}
                </View>
                <Button
                  title={
                    isRestoring
                      ? 'Restoring...'
                      : restoreTokens > 0
                      ? 'Restore (1 Token)'
                      : 'Restore'
                  }
                  variant="primary"
                  size="sm"
                  onPress={() => handleRestoreStreak(restoreTokens > 0)}
                  disabled={isRestoring}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Segmented Navigation Tabs */}
        <View style={styles.tabsContainer}>
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isTabActive = currentTabId === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isTabActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <IconComponent
                  size={16}
                  color={isTabActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    isTabActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Panels */}
        <View style={styles.tabContentContainer}>
          {/* Series / Favorites Panel */}
          {currentTabId === 'series' && (
            <View style={styles.panelContainer}>
              <Card style={styles.seriesItemCard}>
                <View style={styles.seriesCoverPlaceholder}>
                  <BookOpen size={24} color={colors.primary} />
                </View>
                <View style={styles.seriesMeta}>
                  <Text style={styles.seriesTitle}>Shadow City: Neon Blade</Text>
                  <Text style={styles.seriesSubtitle}>Action • 42 Chapters • Ongoing</Text>
                  <View style={styles.seriesStatsRow}>
                    <View style={styles.statInline}>
                      <Eye size={12} color={colors.textMuted} />
                      <Text style={styles.statInlineText}>124k Views</Text>
                    </View>
                    <View style={styles.statInline}>
                      <Heart size={12} color={colors.danger} />
                      <Text style={styles.statInlineText}>9.8k Likes</Text>
                    </View>
                  </View>
                </View>
              </Card>

              <Card style={styles.seriesItemCard}>
                <View style={[styles.seriesCoverPlaceholder, { backgroundColor: '#1e293b' }]}>
                  <Sparkles size={24} color={colors.warning} />
                </View>
                <View style={styles.seriesMeta}>
                  <Text style={styles.seriesTitle}>Archmage Curriculum</Text>
                  <Text style={styles.seriesSubtitle}>Fantasy • 29 Chapters • Ongoing</Text>
                  <View style={styles.seriesStatsRow}>
                    <View style={styles.statInline}>
                      <Eye size={12} color={colors.textMuted} />
                      <Text style={styles.statInlineText}>54k Views</Text>
                    </View>
                    <View style={styles.statInline}>
                      <Heart size={12} color={colors.danger} />
                      <Text style={styles.statInlineText}>4.1k Likes</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Posts Panel (Creators & Studios only) */}
          {currentTabId === 'posts' && !isReader && (
            <View style={styles.panelContainer}>
              <Card style={styles.postCard}>
                <Text style={styles.postTime}>Yesterday at 4:30 PM</Text>
                <Text style={styles.postContent}>
                  Just finished the draft for Episode 43! Lineart begins tomorrow morning.
                  Thank you all for the comments and support on this arc!
                </Text>
                <View style={styles.postFooterRow}>
                  <View style={styles.postAction}>
                    <Heart size={14} color={colors.danger} />
                    <Text style={styles.postActionText}>142 Likes</Text>
                  </View>
                  <View style={styles.postAction}>
                    <MessageSquare size={14} color={colors.textMuted} />
                    <Text style={styles.postActionText}>28 Comments</Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* About Panel */}
          {currentTabId === 'about' && (
            <View style={styles.panelContainer}>
              <Card style={styles.aboutCard}>
                <View style={styles.aboutRow}>
                  <Calendar size={16} color={colors.textMuted} />
                  <Text style={styles.aboutLabel}>Member Since</Text>
                  <Text style={styles.aboutValue}>August 2026</Text>
                </View>

                <View style={styles.aboutDivider} />

                <View style={styles.aboutRow}>
                  <Award size={16} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutLabel}>Reputation</Text>
                    <Text style={styles.aboutSublabel}>
                      Earned through comments on chapters & posts
                    </Text>
                  </View>
                  <Text style={[styles.aboutValue, { color: colors.warning }]}>
                    +{reputation} Points
                  </Text>
                </View>

                <View style={styles.aboutDivider} />

                <View style={styles.aboutRow}>
                  <Flame size={16} color="#f97316" />
                  <Text style={styles.aboutLabel}>Reading Streak</Text>
                  <Text style={[styles.aboutValue, { color: '#f97316' }]}>
                    {streak} Days Active
                  </Text>
                </View>
              </Card>
            </View>
          )}

          {/* Activity Panel - Reading Journal for Readers */}
          {currentTabId === 'activity' && isReader && (
            <View style={styles.panelContainer}>
              {/* Today's Reading Section */}
              <Text style={styles.journalSectionTitle}>Today's Reading</Text>
              <Card style={styles.todayReadingCard}>
                <View style={styles.todayCover}>
                  <BookOpen size={24} color={colors.primary} />
                </View>
                <View style={styles.todayMeta}>
                  <Text style={styles.todayTitle}>Shadow City: Neon Blade</Text>
                  <View style={styles.todayStatusRow}>
                    <CheckCircle size={14} color={colors.success} />
                    <Text style={styles.todayStatusText}>Chapter 42 completed</Text>
                  </View>
                  <View style={styles.todayTimeRow}>
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={styles.todayTimeText}>18 minutes</Text>
                  </View>
                </View>
              </Card>

              {/* Reading Summary Section */}
              <Text style={styles.journalSectionTitle}>Reading Summary</Text>
              <View style={styles.summaryGrid}>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>1h 42m</Text>
                  <Text style={styles.summaryLabel}>Today</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>18 Chapters</Text>
                  <Text style={styles.summaryLabel}>This Week</Text>
                </Card>
              </View>

              {/* Recent History Section */}
              <Text style={styles.journalSectionTitle}>Recent History</Text>
              <View style={styles.historyList}>
                <Card style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Archmage Curriculum</Text>
                    <Text style={styles.historyDate}>Yesterday</Text>
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyChapter}>Chapter 29</Text>
                    <View style={styles.historyDuration}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={styles.historyDurationText}>22m read</Text>
                    </View>
                  </View>
                </Card>

                <Card style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Dragon Ashes</Text>
                    <Text style={styles.historyDate}>2 days ago</Text>
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyChapter}>Chapter 11</Text>
                    <View style={styles.historyDuration}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={styles.historyDurationText}>15m read</Text>
                    </View>
                  </View>
                </Card>

                <Card style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Void Runner</Text>
                    <Text style={styles.historyDate}>3 days ago</Text>
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyChapter}>Chapter 8</Text>
                    <View style={styles.historyDuration}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={styles.historyDurationText}>14m read</Text>
                    </View>
                  </View>
                </Card>
              </View>
            </View>
          )}

          {/* Activity Panel for Creators / Studios / Admins */}
          {currentTabId === 'activity' && !isReader && (
            <View style={styles.panelContainer}>
              <Card style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Activity size={16} color={colors.primary} />
                  <Text style={styles.activityTitle}>
                    {isCreator
                      ? 'Episode 42 Published'
                      : isStudio
                      ? 'Production Asset Approved'
                      : 'Audit Action Logged'}
                  </Text>
                  <Text style={styles.activityTime}>2h ago</Text>
                </View>
                <Text style={styles.activityDesc}>
                  {isCreator
                    ? 'Published "Shadow City: Neon Blade - Episode 42: Midnight Reckoning"'
                    : isStudio
                    ? 'Inking approved for Episode 43 lineart by Studio Director'
                    : 'Creator application approved for Studio Spectre by Staff'}
                </Text>
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    height: 140,
    position: 'relative',
    marginBottom: 44,
  },
  bannerBackground: {
    height: 140,
    backgroundColor: '#1e3a8a',
    overflow: 'hidden',
  },
  bannerDecorCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#2563eb',
    opacity: 0.35,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -36,
    left: spacing.md,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1f2937',
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  profileMetaContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  displayName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
  },
  usernameText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  bioText: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shareSquareButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  streakNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statNumber: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // Streak Recovery Card
  recoveryContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  recoveryCard: {
    backgroundColor: '#171b26',
    borderColor: '#2b3345',
    padding: spacing.md,
    gap: spacing.sm,
  },
  recoveryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoveryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recoveryTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  recoveryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  recoveryDesc: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  recoveryTokenNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  recoveryTokenNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  recoveryPlatformNote: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  recoveryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  recoveryCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  recoveryCostText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f59e0b',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  tabContentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  panelContainer: {
    gap: spacing.md,
  },

  // Series Cards
  seriesItemCard: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  seriesCoverPlaceholder: {
    width: 64,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  seriesTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  seriesSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  seriesStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  statInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statInlineText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },

  // Posts Card
  postCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  postTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  postContent: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  postFooterRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // About Card
  aboutCard: {
    padding: spacing.md,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  aboutLabel: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
  aboutSublabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  aboutValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  aboutDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // Reading Journal Styles
  journalSectionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  todayReadingCard: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  todayCover: {
    width: 60,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayMeta: {
    flex: 1,
    gap: 4,
  },
  todayTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text,
  },
  todayStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  todayTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  todayTimeText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryNumber: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },

  // History List
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyChapter: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  historyDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDurationText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  // Generic Activity Card for Creators/Staff
  activityCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activityTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  activityDesc: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
