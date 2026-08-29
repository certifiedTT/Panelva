import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  RefreshControl,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../theme/ThemeContext';
import { trpc } from '../../lib/trpc';
import {
  CreatorHubIcon,
  SparklesIcon,
  PaletteIcon,
  UsersIcon,
  HeartIcon,
  BookmarkIcon,
  CommentIcon,
  ShareIcon,
  UserPlusIcon,
  TrendingUpIcon,
  CheckIcon,
  PlusIcon,
  BookOpenIcon,
  EyeIcon,
} from '../components/common/Icons';
import { MOCK_CREATOR_POSTS } from '../data/mockData';
import { isCreatorRole } from '../data/mockRoles';
import { getLocalFeedCache, setLocalFeedCache, CACHE_KEYS } from '../hooks/useFeedPrefetch';

interface CreatorHubScreenProps {
  sessionToken: string | null;
  sessionUser: any;
  dbUser: any;
  onRequireAuth: () => void;
  onOpenBecomeCreator: () => void;
  onViewCreatorProfile: (creatorProfileId: string) => void;
  onOpenCreatePost: () => void;
}

export function CreatorHubScreen({
  sessionToken,
  sessionUser,
  dbUser,
  onRequireAuth,
  onOpenBecomeCreator,
  onViewCreatorProfile,
  onOpenCreatePost,
}: CreatorHubScreenProps) {
  const { colors } = useTheme();

  const currentRole = dbUser?.role || sessionUser?.role || 'USER';
  const isCreator = isCreatorRole(currentRole);

  // Reader Hub Feeds (Discover, following, featured only - Recent removed)
  const [readerFeedTab, setReaderFeedTab] = useState<'discover' | 'following' | 'featured'>('discover');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Cached posts for instant 0ms render
  const [cachedPosts, setCachedPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Reader Post comment input & optimistic engagement state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [localPollVotes, setLocalPollVotes] = useState<Record<string, number>>({});
  const [localFollows, setLocalFollows] = useState<Record<string, boolean>>({});
  const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({});
  const [localBookmarks, setLocalBookmarks] = useState<Record<string, boolean>>({});

  // 1. Instant Cache Loader (0ms initial display)
  useEffect(() => {
    let isMounted = true;
    async function loadCache() {
      const cacheKey =
        readerFeedTab === 'following'
          ? CACHE_KEYS.HUB_FOLLOWING
          : readerFeedTab === 'featured'
          ? CACHE_KEYS.HUB_FEATURED
          : CACHE_KEYS.HUB_DISCOVER;

      const cached = await getLocalFeedCache<any>(cacheKey);
      if (isMounted && cached?.items && cached.items.length > 0) {
        setCachedPosts(cached.items);
      }
    }
    loadCache();
    return () => {
      isMounted = false;
    };
  }, [readerFeedTab]);

  // 2. Query Hub Feed from Backend (stale-while-revalidate)
  const { data: hubFeedData, isLoading: feedLoading, refetch: refetchFeed } = (trpc.post.getHubFeed as any).useQuery({
    tab: readerFeedTab,
    currentUserId: dbUser?.id || undefined,
    limit: 25,
  });

  // Sync fresh tRPC query to local cache
  useEffect(() => {
    if (hubFeedData?.items && hubFeedData.items.length > 0) {
      const cacheKey =
        readerFeedTab === 'following'
          ? CACHE_KEYS.HUB_FOLLOWING
          : readerFeedTab === 'featured'
          ? CACHE_KEYS.HUB_FEATURED
          : CACHE_KEYS.HUB_DISCOVER;

      setLocalFeedCache(cacheKey, hubFeedData);
    }
  }, [hubFeedData, readerFeedTab]);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchFeed();
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  // Post interactions mutations
  const followCreatorMutation = trpc.post.followCreator.useMutation({
    onSuccess: () => {
      refetchFeed();
    },
    onError: (err: any) => Alert.alert('Follow Error', err.message),
  });

  const likePostMutation = trpc.post.likePost.useMutation({
    onSuccess: () => refetchFeed(),
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const bookmarkPostMutation = trpc.post.bookmarkPost.useMutation({
    onSuccess: () => refetchFeed(),
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const votePollMutation = trpc.post.castPollVote.useMutation({
    onSuccess: () => refetchFeed(),
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const addCommentMutation = trpc.post.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      setActiveCommentPostId(null);
      refetchFeed();
      Alert.alert('Success', 'Comment posted on creator update!');
    },
    onError: (err: any) => Alert.alert('Comment Error', err.message),
  });

  const handleToggleFollow = (creatorProfileId: string, currentStatus: boolean) => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    setLocalFollows((prev) => ({ ...prev, [creatorProfileId]: !currentStatus }));
    followCreatorMutation.mutate({ creatorProfileId });
  };

  const handleLikePost = (postId: string, initialLiked: boolean) => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    const current = localLikes[postId] !== undefined ? localLikes[postId] : initialLiked;
    setLocalLikes((prev) => ({ ...prev, [postId]: !current }));
    likePostMutation.mutate({ postId });
  };

  const handleBookmarkPost = (postId: string, initialBookmarked: boolean) => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    const current = localBookmarks[postId] !== undefined ? localBookmarks[postId] : initialBookmarked;
    setLocalBookmarks((prev) => ({ ...prev, [postId]: !current }));
    bookmarkPostMutation.mutate({ postId });
  };

  const handleVotePoll = (postId: string, choiceIndex: number) => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    votePollMutation.mutate({ postId, choiceIndex });
  };

  const handleSendComment = (postId: string) => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ postId, content: commentText.trim() });
  };

  const handleSharePost = async (post: any) => {
    try {
      const postUrl = `https://panelva.com/hub?post=${post.id}`;
      const creatorName = post.creatorProfile?.penName || 'Creator';
      await Share.share({
        title: post.title || `Post by @${creatorName}`,
        message: `${post.title ? `"${post.title}" - ` : ''}Check out this creator update from @${creatorName} on Panelva!\n${postUrl}`,
        url: Platform.OS === 'ios' ? postUrl : undefined,
      });
    } catch (err: any) {
      console.warn('Share error:', err);
    }
  };

  // Instant fallback priority: Fresh backend data > Local cache > Mock
  const rawPosts = (hubFeedData?.items && hubFeedData.items.length > 0)
    ? hubFeedData.items
    : cachedPosts.length > 0
    ? cachedPosts
    : MOCK_CREATOR_POSTS;

  const hashtags = [
    '#ConceptArt',
    '#BehindTheScenes',
    '#ChapterPreview',
    '#Announcement',
    '#Poll',
  ];

  const filteredPosts = rawPosts.filter((post: any) => {
    if (!selectedTag) return true;
    return (post.content || '').includes(selectedTag) || (post.title || '').includes(selectedTag);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Social Feed Header */}
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CreatorHubIcon size={22} color={colors.primary} />
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Creator Hub</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  Community social feed • Sketches, polls & updates
                </Text>
              </View>
            </View>

            {/* Post button for creators */}
            {isCreator && (
              <TouchableOpacity
                style={[styles.createPostPill, { backgroundColor: colors.primary }]}
                onPress={onOpenCreatePost}
                activeOpacity={0.8}
              >
                <PlusIcon size={14} color="#FFFFFF" />
                <Text style={styles.createPostPillText}>Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Feed Filter Tabs */}
        <View style={[styles.feedTabsRow, { borderBottomColor: colors.borderSubtle }]}>
          {(['discover', 'following', 'featured'] as const).map((tab) => {
            const isSelected = readerFeedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.feedTabBtn, isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => {
                  setReaderFeedTab(tab);
                  setSelectedTag(null);
                }}
              >
                <Text
                  style={[
                    styles.feedTabText,
                    { color: isSelected ? colors.primary : colors.textMuted, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {tab === 'discover' ? 'Discover' : tab === 'following' ? 'Following' : 'Featured'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hot Topics Hashtags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagBar}>
          <TouchableOpacity
            style={[
              styles.tagPill,
              {
                backgroundColor: selectedTag === null ? colors.primary : colors.surfaceElevated,
                borderColor: selectedTag === null ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedTag(null)}
          >
            <Text style={[styles.tagText, { color: selectedTag === null ? '#FFFFFF' : colors.textMuted }]}>
              All Topics
            </Text>
          </TouchableOpacity>
          {hashtags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagPill,
                {
                  backgroundColor: selectedTag === tag ? colors.primary : colors.surfaceElevated,
                  borderColor: selectedTag === tag ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              <Text style={[styles.tagText, { color: selectedTag === tag ? '#FFFFFF' : colors.textMuted }]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feed Posts */}
        <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
          {filteredPosts.length > 0 ? (
            <View style={{ gap: 16 }}>
              {filteredPosts.map((post: any) => {
                const media = (() => {
                  if (Array.isArray(post.mediaUrls)) return post.mediaUrls;
                  try {
                    return JSON.parse(post.mediaUrls || '[]');
                  } catch {
                    return [];
                  }
                })();
                const pollOpts = (() => {
                  if (Array.isArray(post.pollOptions)) return post.pollOptions;
                  try {
                    return JSON.parse(post.pollOptions || '[]');
                  } catch {
                    return [];
                  }
                })();
                const pollVotes = (() => {
                  if (typeof post.pollVotes === 'object' && post.pollVotes !== null) return post.pollVotes;
                  try {
                    return JSON.parse(post.pollVotes || '{}');
                  } catch {
                    return {};
                  }
                })();

                const userVotedChoice = localPollVotes[post.id] !== undefined
                  ? localPollVotes[post.id]
                  : dbUser?.id
                  ? pollVotes[dbUser.id]
                  : undefined;

                const isAuthor = dbUser?.id && post.creatorProfile?.userId === dbUser.id;
                const serverFollow = post.isFollowing ?? false;
                const isFollowed = localFollows[post.creatorProfileId] !== undefined
                  ? localFollows[post.creatorProfileId]
                  : serverFollow;

                const serverLiked = post.isLiked ?? (dbUser?.id ? post.likes?.some((l: any) => l.userId === dbUser.id) : false);
                const isLiked = localLikes[post.id] !== undefined ? localLikes[post.id] : serverLiked;
                const rawLikesCount = post.likes?.length || 0;
                const likesCount = isLiked === serverLiked ? rawLikesCount : isLiked ? rawLikesCount + 1 : Math.max(0, rawLikesCount - 1);

                const serverBookmarked = post.isBookmarked ?? (dbUser?.id ? post.bookmarks?.some((b: any) => b.userId === dbUser.id) : false);
                const isBookmarked = localBookmarks[post.id] !== undefined ? localBookmarks[post.id] : serverBookmarked;

                return (
                  <View
                    key={post.id}
                    style={[styles.postCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  >
                    {/* Creator Header & Direct Follow */}
                    <View style={styles.postAuthorRow}>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                        onPress={() => onViewCreatorProfile(post.creatorProfileId)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.postAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.postAvatarText}>
                            {post.creatorProfile?.penName?.charAt(0).toUpperCase() || 'C'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.postAuthorName, { color: colors.text }]}>
                              {post.creatorProfile?.penName || 'Creator'}
                            </Text>
                            {post.creatorProfile?.isVetted && (
                              <View style={[styles.verifiedTag, { backgroundColor: colors.primaryMuted }]}>
                                <Text style={[styles.verifiedTagText, { color: colors.primary }]}>Verified</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.postDate, { color: colors.textMuted }]}>
                            {new Date(post.createdAt).toLocaleDateString()} • {post.type?.replace('_', ' ')}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Direct Follow Button */}
                      {!isAuthor && (
                        <TouchableOpacity
                          style={[
                            styles.postFollowBtn,
                            {
                              backgroundColor: isFollowed ? colors.surface : colors.primary,
                              borderColor: isFollowed ? colors.border : colors.primary,
                            },
                          ]}
                          onPress={() => handleToggleFollow(post.creatorProfileId, isFollowed, post.creatorProfile?.penName)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.postFollowText, { color: isFollowed ? colors.textMuted : '#FFFFFF' }]}>
                            {isFollowed ? 'Following' : '+ Follow'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Post Content */}
                    <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
                    <Text style={[styles.postBody, { color: colors.textSecondary }]}>{post.content}</Text>

                    {/* Media Artwork Image */}
                    {media.length > 0 && (
                      <View style={styles.postMediaContainer}>
                        <ExpoImage source={{ uri: media[0] }} style={styles.postMediaImg} contentFit="cover" />
                      </View>
                    )}

                    {/* Poll Component */}
                    {pollOpts.length > 0 && (
                      <View style={[styles.pollBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={[styles.pollHeading, { color: colors.textSecondary }]}>Interactive Poll</Text>
                          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>Active Voting</Text>
                        </View>
                        {pollOpts.map((opt: string, idx: number) => {
                          const isSelected = userVotedChoice === idx;
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[
                                styles.pollOptionBtn,
                                {
                                  backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceElevated,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                              onPress={() => handleVotePoll(post.id, idx)}
                            >
                              <Text style={{ fontSize: 12, color: colors.text, fontWeight: isSelected ? '700' : '500' }}>
                                {opt}
                              </Text>
                              {isSelected && <CheckIcon size={14} color={colors.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Action Bar: Likes, Comments, Bookmark, Share */}
                    <View style={[styles.actionBar, { borderTopColor: colors.borderSubtle }]}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleLikePost(post.id, serverLiked)}
                        activeOpacity={0.7}
                      >
                        <HeartIcon
                          size={18}
                          color={isLiked ? colors.error : colors.textMuted}
                          fill={isLiked ? colors.error : 'none'}
                        />
                        <Text style={[styles.actionBtnText, { color: isLiked ? colors.error : colors.textMuted }]}>
                          {likesCount}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() =>
                          setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                        }
                        activeOpacity={0.7}
                      >
                        <CommentIcon size={18} color={colors.textMuted} />
                        <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>
                          {post.comments?.length || 0}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleBookmarkPost(post.id, serverBookmarked)}
                        activeOpacity={0.7}
                      >
                        <BookmarkIcon
                          size={18}
                          color={isBookmarked ? colors.primary : colors.textMuted}
                          fill={isBookmarked ? colors.primary : 'none'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSharePost(post)}
                        activeOpacity={0.7}
                      >
                        <ShareIcon size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    {/* Comment Input Box */}
                    {activeCommentPostId === post.id && (
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                        {post.comments && post.comments.length > 0 && (
                          <View style={{ gap: 6, marginBottom: 8 }}>
                            {post.comments.map((c: any) => (
                              <View key={c.id} style={{ flexDirection: 'row', gap: 6 }}>
                                <Text style={[styles.commentAuthor, { color: colors.primary }]}>
                                  @{c.user?.username || 'Reader'}:
                                </Text>
                                <Text style={[styles.commentBody, { color: colors.textSecondary }]}> {c.content}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TextInput
                            style={[styles.commentInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            placeholder="Write a comment..."
                            placeholderTextColor={colors.textMuted}
                            value={commentText}
                            onChangeText={setCommentText}
                          />
                          <TouchableOpacity
                            style={[styles.sendCommentBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleSendComment(post.id)}
                          >
                            <Text style={styles.sendCommentBtnText}>Post</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyFeedBox}>
              <CreatorHubIcon size={44} color={colors.textMuted} />
              <Text style={[styles.emptyFeedTitle, { color: colors.text }]}>No Updates Found</Text>
              <Text style={[styles.emptyFeedSub, { color: colors.textMuted }]}>
                {readerFeedTab === 'following'
                  ? 'Follow creators to see their latest illustrations, novels, and polls here.'
                  : 'Be the first to explore discover & featured creator updates.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  createPostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createPostPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  feedTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  feedTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  feedTabText: {
    fontSize: 13,
  },
  tagBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  postCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  postFollowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postFollowText: {
    fontSize: 11,
    fontWeight: '700',
  },
  postDate: {
    fontSize: 11,
    marginTop: 2,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  postBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  postMediaContainer: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
    height: 200,
  },
  postMediaImg: {
    width: '100%',
    height: '100%',
  },
  pollBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  pollHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pollOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  commentBody: {
    fontSize: 11,
  },
  commentInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
  },
  sendCommentBtn: {
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCommentBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyFeedBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyFeedTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyFeedSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
