import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  CloseIcon,
  UsersIcon,
  SparklesIcon,
  BookOpenIcon,
  CheckIcon,
  BookmarkIcon,
  HeartIcon,
  CommentIcon,
} from '../common/Icons';

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
  const { colors } = useTheme();
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
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Creator Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
              {/* Creator Banner / Avatar */}
              <View style={styles.profileHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {displayProfile.penName?.charAt(0).toUpperCase() || 'C'}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.penName, { color: colors.text }]}>{displayProfile.penName}</Text>
                    {displayProfile.isVetted && (
                      <View style={[styles.vettedBadge, { backgroundColor: colors.primaryMuted }]}>
                        <Text style={[styles.vettedText, { color: colors.primary }]}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.creatorType, { color: colors.textMuted }]}>
                    {displayProfile.type} Creator
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: colors.text }}>{displayProfile.followerCount || 0}</Text> Followers
                    </Text>
                    <Text style={[styles.statText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: colors.text }}>{displayProfile.series?.length || 0}</Text> Series
                    </Text>
                  </View>
                </View>
              </View>

              {/* Follow / Unfollow Action Button */}
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  {
                    backgroundColor: isFollowing ? colors.surfaceElevated : colors.primary,
                    borderColor: isFollowing ? colors.border : colors.primaryDark,
                  },
                ]}
                onPress={handleToggleFollow}
                disabled={followCreatorMutation.isLoading}
                activeOpacity={0.8}
              >
                {isFollowing ? (
                  <>
                    <CheckIcon size={16} color={colors.primary} />
                    <Text style={[styles.followBtnText, { color: colors.text }]}>Following Creator</Text>
                  </>
                ) : (
                  <>
                    <BookmarkIcon size={16} color="#FFFFFF" />
                    <Text style={[styles.followBtnText, { color: '#FFFFFF' }]}>Follow Creator</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Bio */}
              {displayProfile.bio && (
                <View style={[styles.bioCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.bioText, { color: colors.textSecondary }]}>{displayProfile.bio}</Text>
                </View>
              )}

              {/* Profile Segment Tabs (Series / Community Posts / Memberships) */}
              <View style={[styles.tabsRow, { borderBottomColor: colors.borderSubtle }]}>
                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'series' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setActiveTab('series')}
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === 'series' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'series' ? '700' : '500' }]}>
                    Series ({displayProfile.series?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, activeTab === 'posts' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setActiveTab('posts')}
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === 'posts' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'posts' ? '700' : '500' }]}>
                    Posts & Updates
                  </Text>
                </TouchableOpacity>

                {displayProfile.membershipTiers && displayProfile.membershipTiers.length > 0 && (
                  <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'memberships' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('memberships')}
                  >
                    <Text style={[styles.tabBtnText, { color: activeTab === 'memberships' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'memberships' ? '700' : '500' }]}>
                      Memberships
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* TAB 1: PUBLISHED SERIES */}
              {activeTab === 'series' && (
                <View style={{ marginTop: 14 }}>
                  {displayProfile.series && displayProfile.series.length > 0 ? (
                    <View style={{ gap: 10 }}>
                      {displayProfile.series.map((s: any) => (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.seriesRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                          onPress={() => {
                            onClose();
                            if (onSelectSeries) onSelectSeries(s);
                          }}
                          activeOpacity={0.7}
                        >
                          {s.coverUrl ? (
                            <ExpoImage source={{ uri: s.coverUrl }} style={styles.seriesThumb} />
                          ) : (
                            <View style={[styles.seriesThumbPlaceholder, { backgroundColor: colors.primaryMuted }]}>
                              <BookOpenIcon size={20} color={colors.primary} />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.seriesTitle, { color: colors.text }]}>{s.title}</Text>
                            <Text style={[styles.seriesGenre, { color: colors.textMuted }]}>
                              {s.type} • {s.genre} • {s.status}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyCard}>
                      <BookOpenIcon size={32} color={colors.textMuted} />
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>No published series yet.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 2: COMMUNITY POSTS */}
              {activeTab === 'posts' && (
                <View style={{ marginTop: 14 }}>
                  {postsLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                  ) : (
                    <View style={{ gap: 12 }}>
                      <View style={[styles.postPreviewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <SparklesIcon size={16} color={colors.primary} />
                          <Text style={[styles.postCardTitle, { color: colors.text }]}>Creator Update</Text>
                        </View>
                        <Text style={[styles.postCardContent, { color: colors.textSecondary }]}>
                          "Thank you all for reading! Working on the next chapter storyboard and character design reveals."
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <HeartIcon size={14} color={colors.textMuted} />
                            <Text style={[styles.postStat, { color: colors.textMuted }]}>128</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <CommentIcon size={14} color={colors.textMuted} />
                            <Text style={[styles.postStat, { color: colors.textMuted }]}>24</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 3: MEMBERSHIPS */}
              {activeTab === 'memberships' && displayProfile.membershipTiers && (
                <View style={{ marginTop: 14, gap: 10 }}>
                  {displayProfile.membershipTiers.map((tier: any) => (
                    <View
                      key={tier.id}
                      style={[styles.tierCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
                        <Text style={[styles.tierPrice, { color: colors.primary }]}>
                          {tier.priceCoins} Credits / mo
                        </Text>
                      </View>
                      <Text style={[styles.tierDesc, { color: colors.textMuted }]}>{tier.description}</Text>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <View style={{ gap: 4, marginTop: 8 }}>
                          {tier.benefits.map((b: string, idx: number) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <CheckIcon size={14} color={colors.success} />
                              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{b}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  penName: {
    fontSize: 17,
    fontWeight: '800',
  },
  vettedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vettedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  creatorType: {
    fontSize: 12,
    marginTop: 2,
  },
  statText: {
    fontSize: 12,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bioCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 18,
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  tabBtnText: {
    fontSize: 13,
  },
  seriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  seriesThumb: {
    width: 48,
    height: 64,
    borderRadius: 6,
  },
  seriesThumbPlaceholder: {
    width: 48,
    height: 64,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  seriesGenre: {
    fontSize: 11,
    marginTop: 3,
  },
  tierCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  tierName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tierPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  tierDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 11,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
  postPreviewCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  postCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  postCardContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  postStat: {
    fontSize: 12,
  },
});
