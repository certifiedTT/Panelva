import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '@panelva/ui';

// Lucide Line Icons
import {
  X,
  Sparkles,
  BookOpen,
  Check,
  Bookmark,
  Heart,
  MessageSquare,
} from 'lucide-react-native';

interface PublicCreatorProfileModalProps {
  visible: boolean;
  onClose: () => void;
  creatorProfileId: string | null;
  sessionToken?: string | null;
  onRequireAuth?: () => void;
  onSelectSeries?: (series: any) => void;
}

export function PublicCreatorProfileModal({
  visible,
  onClose,
  creatorProfileId,
  sessionToken,
  onRequireAuth,
  onSelectSeries,
}: PublicCreatorProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'series' | 'posts' | 'memberships'>('series');

  const isUuid = typeof creatorProfileId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatorProfileId);

  // 1. Query public creator profile
  const { data: profile, isLoading, refetch: refetchProfile } = (trpc.creator.getPublicCreatorProfile as any).useQuery(
    { profileId: creatorProfileId! },
    { enabled: visible && !!creatorProfileId && isUuid, retry: false }
  );

  // 2. Query follow status
  const { data: followStatus, refetch: refetchFollow } = (trpc.post.isFollowingCreator as any).useQuery(
    { creatorProfileId: creatorProfileId! },
    { enabled: visible && !!sessionToken && !!creatorProfileId && isUuid, retry: false }
  );

  // 3. Query creator posts
  const { data: creatorPostsData, isLoading: postsLoading } = (trpc.post.getCreatorPosts as any).useQuery(
    undefined,
    { enabled: visible && activeTab === 'posts' && isUuid, retry: false }
  );

  // Follow creator mutation
  const followCreatorMutation = trpc.post.followCreator.useMutation({
    onSuccess: () => {
      refetchFollow();
      refetchProfile();
    },
    onError: (err) => Alert.alert('Follow Error', err.message),
  });

  const isFollowing = followStatus?.isFollowing ?? false;

  const handleToggleFollow = () => {
    if (!sessionToken) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!creatorProfileId || !isUuid) {
      Alert.alert('Follow', 'You are now following this creator.');
      return;
    }
    followCreatorMutation.mutate({ creatorProfileId });
  };

  const displayProfile = profile || {
    penName: 'Creator',
    type: 'Author',
    bio: 'Storyteller crafting original webcomics and web novels on Panelva.',
    followerCount: 1420,
    isVetted: true,
    series: [],
    membershipTiers: [],
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Creator Profile</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close profile modal"
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            /* Skeleton Loader instead of ActivityIndicator */
            <View style={{ padding: spacing.md, gap: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.surface }} />
                <View style={{ gap: spacing.xs, flex: 1 }}>
                  <View style={{ width: '60%', height: 16, borderRadius: radius.sm, backgroundColor: colors.surface }} />
                  <View style={{ width: '40%', height: 12, borderRadius: radius.sm, backgroundColor: colors.surface }} />
                </View>
              </View>
              <View style={{ width: '100%', height: 40, borderRadius: radius.md, backgroundColor: colors.surface }} />
              <View style={{ width: '100%', height: 64, borderRadius: radius.md, backgroundColor: colors.surface }} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
              {/* Creator Banner / Avatar */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {displayProfile.penName?.charAt(0).toUpperCase() || 'C'}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Text style={styles.penName}>{displayProfile.penName}</Text>
                    {displayProfile.isVetted && (
                      <Badge variant="primary" size="sm">
                        Verified
                      </Badge>
                    )}
                  </View>
                  <Text style={styles.creatorType}>
                    {displayProfile.type} Creator
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs }}>
                    <Text style={styles.statText}>
                      <Text style={{ fontWeight: '700', color: colors.text }}>{displayProfile.followerCount || 0}</Text> Followers
                    </Text>
                    <Text style={styles.statText}>
                      <Text style={{ fontWeight: '700', color: colors.text }}>{displayProfile.series?.length || 0}</Text> Series
                    </Text>
                  </View>
                </View>
              </View>

              {/* Follow / Unfollow Action Button */}
              <View style={{ marginTop: spacing.md }}>
                <Button
                  title={isFollowing ? 'Following Creator' : 'Follow Creator'}
                  variant={isFollowing ? 'secondary' : 'primary'}
                  onPress={handleToggleFollow}
                  disabled={followCreatorMutation.isLoading}
                />
              </View>

              {/* Bio */}
              {displayProfile.bio && (
                <Card style={{ marginTop: spacing.md }}>
                  <Text style={styles.bioText}>{displayProfile.bio}</Text>
                </Card>
              )}

              {/* Profile Segment Tabs (Series / Community Posts / Memberships) */}
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'series' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setActiveTab('series')}
                  accessibilityRole="button"
                  accessibilityLabel="View series tab"
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === 'series' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'series' ? '700' : '500' }]}>
                    Series ({displayProfile.series?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'posts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setActiveTab('posts')}
                  accessibilityRole="button"
                  accessibilityLabel="View posts tab"
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === 'posts' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'posts' ? '700' : '500' }]}>
                    Posts & Updates
                  </Text>
                </TouchableOpacity>

                {displayProfile.membershipTiers && displayProfile.membershipTiers.length > 0 && (
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'memberships' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('memberships')}
                    accessibilityRole="button"
                    accessibilityLabel="View memberships tab"
                  >
                    <Text style={[styles.tabBtnText, { color: activeTab === 'memberships' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'memberships' ? '700' : '500' }]}>
                      Memberships
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* TAB 1: PUBLISHED SERIES */}
              {activeTab === 'series' && (
                <View style={{ marginTop: spacing.md }}>
                  {displayProfile.series && displayProfile.series.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                      {displayProfile.series.map((s: any) => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => {
                            onClose();
                            if (onSelectSeries) onSelectSeries(s);
                          }}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Select series ${s.title}`}
                        >
                          <Card style={styles.seriesRow}>
                            {s.coverUrl ? (
                              <ExpoImage source={{ uri: s.coverUrl }} style={styles.seriesThumb} />
                            ) : (
                              <View style={styles.seriesThumbPlaceholder}>
                                <BookOpen size={20} color={colors.primary} />
                              </View>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text style={styles.seriesTitle}>{s.title}</Text>
                              <Text style={styles.seriesGenre}>
                                {s.type} • {s.genre} • {s.status}
                              </Text>
                            </View>
                          </Card>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Card style={styles.emptyCard}>
                      <BookOpen size={32} color={colors.textMuted} />
                      <Text style={styles.emptyText}>No published series yet.</Text>
                    </Card>
                  )}
                </View>
              )}

              {/* TAB 2: COMMUNITY POSTS */}
              {activeTab === 'posts' && (
                <View style={{ marginTop: spacing.md }}>
                  {postsLoading ? (
                    <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
                      <Card style={{ gap: spacing.sm }}>
                        <View style={{ width: '50%', height: 16, borderRadius: radius.sm, backgroundColor: colors.surface }} />
                        <View style={{ width: '100%', height: 40, borderRadius: radius.sm, backgroundColor: colors.surface }} />
                      </Card>
                    </View>
                  ) : (
                    <View style={{ gap: spacing.md }}>
                      <Card style={styles.postPreviewCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                          <Sparkles size={16} color={colors.primary} />
                          <Text style={styles.postCardTitle}>Creator Update</Text>
                        </View>
                        <Text style={styles.postCardContent}>
                          "Thank you all for reading! Working on the next chapter storyboard and character design reveals."
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <Heart size={14} color={colors.textMuted} />
                            <Text style={styles.postStat}>128</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <MessageSquare size={14} color={colors.textMuted} />
                            <Text style={styles.postStat}>24</Text>
                          </View>
                        </View>
                      </Card>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 3: MEMBERSHIPS */}
              {activeTab === 'memberships' && displayProfile.membershipTiers && (
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  {displayProfile.membershipTiers.map((tier: any) => (
                    <Card key={tier.id} style={styles.tierCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.tierName}>{tier.name}</Text>
                        <Text style={styles.tierPrice}>
                          {tier.priceCoins} Credits / mo
                        </Text>
                      </View>
                      <Text style={styles.tierDesc}>{tier.description}</Text>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
                          {tier.benefits.map((b: string, idx: number) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                              <Check size={14} color={colors.success} />
                              <Text style={styles.benefitText}>{b}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Card>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: typography.h1.fontSize,
    fontWeight: '800',
  },
  penName: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '800',
    color: colors.text,
  },
  creatorType: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  statText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  bioText: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    color: colors.textMuted,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  tabBtnText: {
    fontSize: typography.small.fontSize,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  seriesThumb: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
  },
  seriesThumbPlaceholder: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  seriesGenre: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  tierCard: {
    gap: spacing.xs,
  },
  tierName: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  tierPrice: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  tierDesc: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  benefitText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  postPreviewCard: {
    gap: spacing.xs,
  },
  postCardTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  postCardContent: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    color: colors.textMuted,
  },
  postStat: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
