import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Platform,
  RefreshControl,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { trpc } from '../../lib/trpc';
import {
  Compass,
  Heart,
  Bookmark,
  MessageSquare,
  Share2,
  Plus,
  Check,
  Sparkles,
  X,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card, Button, Badge, Skeleton, EmptyState, CreatorCard } from '@panelva/ui';
import { MOCK_CREATOR_POSTS, MOCK_CREATORS } from '../data/mockData';
import { isCreatorRole } from '../data/mockRoles';
import { getLocalFeedCache, setLocalFeedCache, CACHE_KEYS } from '../hooks/useFeedPrefetch';
import { CommentSection } from '../components/comments/CommentSection';
import { StickerManagerView } from '../components/creator/StickerManagerView';

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
  const currentRole = dbUser?.role || sessionUser?.role || 'USER';
  const isCreator = isCreatorRole(currentRole);

  // Reader Hub Feeds (Discover, following, featured)
  const [readerFeedTab, setReaderFeedTab] = useState<'discover' | 'following' | 'featured'>('discover');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showStickerManager, setShowStickerManager] = useState(false);

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
  const rawPosts =
    hubFeedData?.items && hubFeedData.items.length > 0
      ? hubFeedData.items
      : cachedPosts.length > 0
      ? cachedPosts
      : MOCK_CREATOR_POSTS;

  const hashtags = ['#ConceptArt', '#BehindTheScenes', '#ChapterPreview', '#Announcement', '#Poll'];

  const filteredPosts = rawPosts.filter((post: any) => {
    if (!selectedTag) return true;
    return (post.content || '').includes(selectedTag) || (post.title || '').includes(selectedTag);
  });

  const isLoadingInitial = feedLoading && cachedPosts.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
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
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              <Compass size={22} color={colors.primary} />
              <View>
                <Text style={styles.headerTitle}>Creator Hub</Text>
                <Text style={styles.headerSubtitle}>
                  Community social feed • Sketches, polls & updates
                </Text>
              </View>
            </View>

            {/* Actions for creators */}
            {isCreator && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.createPostPill, { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                  onPress={() => setShowStickerManager(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Manage Stickers"
                >
                  <Sparkles size={14} color="#60a5fa" />
                  <Text style={[styles.createPostPillText, { color: '#60a5fa' }]}>Stickers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createPostPill}
                  onPress={onOpenCreatePost}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Create Post"
                >
                  <Plus size={14} color={colors.text} />
                  <Text style={styles.createPostPillText}>Post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Feed Filter Tabs */}
        <View style={styles.feedTabsRow}>
          {(['discover', 'following', 'featured'] as const).map((tab) => {
            const isSelected = readerFeedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                accessibilityRole="button"
                accessibilityLabel={`${tab} tab`}
                style={[
                  styles.feedTabBtn,
                  isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => {
                  setReaderFeedTab(tab);
                  setSelectedTag(null);
                }}
              >
                <Text
                  style={[
                    styles.feedTabText,
                    {
                      color: isSelected ? colors.primary : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab === 'discover' ? 'Discover' : tab === 'following' ? 'Following' : 'Featured'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hot Topics Hashtags */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagBar}
        >
          <TouchableOpacity
            style={[
              styles.tagPill,
              {
                backgroundColor: selectedTag === null ? colors.primary : colors.surface,
                borderColor: selectedTag === null ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedTag(null)}
            accessibilityRole="button"
            accessibilityLabel="Show all topics"
          >
            <Text
              style={[
                styles.tagText,
                { color: selectedTag === null ? colors.text : colors.textMuted },
              ]}
            >
              All Topics
            </Text>
          </TouchableOpacity>
          {hashtags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagPill,
                {
                  backgroundColor: selectedTag === tag ? colors.primary : colors.surface,
                  borderColor: selectedTag === tag ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${tag}`}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: selectedTag === tag ? colors.text : colors.textMuted },
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Creators Showcase (Featured Tab) */}
        {readerFeedTab === 'featured' && (
          <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md, gap: spacing.sm }}>
            <Text style={{ ...typography.h3, color: colors.text }}>Featured Creators</Text>
            {MOCK_CREATORS.slice(0, 3).map((creator) => (
              <CreatorCard
                key={creator.id}
                name={creator.penName}
                handle={creator.user?.username}
                avatarUrl={creator.user?.avatarUrl}
                isVerified={creator.isVetted}
                followersCount={creator.followerCount}
                isFollowing={!!localFollows[creator.id]}
                onFollowToggle={() => handleToggleFollow(creator.id, !!localFollows[creator.id])}
                onPress={() => onViewCreatorProfile(creator.id)}
              />
            ))}
          </View>
        )}

        {/* Feed Posts */}
        <View style={styles.feedContainer}>
          {isLoadingInitial ? (
            /* Skeleton Loader per Panelva Engineering Standards */
            <View style={{ gap: spacing.md }}>
              {[1, 2, 3].map((placeholder) => (
                <Card key={placeholder} style={{ gap: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Skeleton width={40} height={40} borderRadius={radius.full} />
                    <View style={{ gap: spacing.xs, flex: 1 }}>
                      <Skeleton width="45%" height={12} borderRadius={radius.sm} />
                      <Skeleton width="25%" height={8} borderRadius={radius.sm} />
                    </View>
                  </View>
                  <Skeleton width="70%" height={16} borderRadius={radius.sm} />
                  <Skeleton width="100%" height={64} borderRadius={radius.md} />
                </Card>
              ))}
            </View>
          ) : filteredPosts.length > 0 ? (
            <View style={{ gap: spacing.md }}>
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
                  if (typeof post.pollVotes === 'object' && post.pollVotes !== null)
                    return post.pollVotes;
                  try {
                    return JSON.parse(post.pollVotes || '{}');
                  } catch {
                    return {};
                  }
                })();

                const userVotedChoice =
                  localPollVotes[post.id] !== undefined
                    ? localPollVotes[post.id]
                    : dbUser?.id
                    ? pollVotes[dbUser.id]
                    : undefined;

                const isAuthor = dbUser?.id && post.creatorProfile?.userId === dbUser.id;
                const serverFollow = post.isFollowing ?? false;
                const isFollowed =
                  localFollows[post.creatorProfileId] !== undefined
                    ? localFollows[post.creatorProfileId]
                    : serverFollow;

                const serverLiked =
                  post.isLiked ??
                  (dbUser?.id ? post.likes?.some((l: any) => l.userId === dbUser.id) : false);
                const isLiked =
                  localLikes[post.id] !== undefined ? localLikes[post.id] : serverLiked;
                const rawLikesCount = post.likes?.length || 0;
                const likesCount =
                  isLiked === serverLiked
                    ? rawLikesCount
                    : isLiked
                    ? rawLikesCount + 1
                    : Math.max(0, rawLikesCount - 1);

                const serverBookmarked =
                  post.isBookmarked ??
                  (dbUser?.id ? post.bookmarks?.some((b: any) => b.userId === dbUser.id) : false);
                const isBookmarked =
                  localBookmarks[post.id] !== undefined
                    ? localBookmarks[post.id]
                    : serverBookmarked;

                return (
                  <Card key={post.id} style={{ gap: spacing.md }}>
                    {/* Creator Header & Direct Follow */}
                    <View style={styles.postAuthorRow}>
                      <TouchableOpacity
                        style={styles.authorProfileButton}
                        onPress={() => onViewCreatorProfile(post.creatorProfileId)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${post.creatorProfile?.penName || 'creator'} profile`}
                      >
                        <View style={styles.postAvatar}>
                          <Text style={styles.postAvatarText}>
                            {post.creatorProfile?.penName?.charAt(0).toUpperCase() || 'C'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.authorNameRow}>
                            <Text style={styles.postAuthorName}>
                              {post.creatorProfile?.penName || 'Creator'}
                            </Text>
                            {post.creatorProfile?.isVetted && (
                              <Badge variant="primary" size="sm">
                                Verified
                              </Badge>
                            )}
                          </View>
                          <Text style={styles.postDate}>
                            {new Date(post.createdAt).toLocaleDateString()} •{' '}
                            {post.type?.replace('_', ' ')}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Direct Follow Button */}
                      {!isAuthor && (
                        <Button
                          size="sm"
                          variant={isFollowed ? "outline" : "primary"}
                          onPress={() => handleToggleFollow(post.creatorProfileId, isFollowed)}
                          leftIcon={
                            isFollowed ? (
                              <Check size={12} color={colors.text} />
                            ) : (
                              <Plus size={12} color={colors.text} />
                            )
                          }
                        >
                          {isFollowed ? 'Following' : 'Follow'}
                        </Button>
                      )}
                    </View>

                    {/* Post Content */}
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <Text style={styles.postBody}>{post.content}</Text>

                    {/* Media Artwork Image */}
                    {media.length > 0 && (
                      <View style={styles.postMediaContainer}>
                        <ExpoImage
                          source={{ uri: media[0] }}
                          style={styles.postMediaImg}
                          contentFit="cover"
                        />
                      </View>
                    )}

                    {/* Poll Component */}
                    {pollOpts.length > 0 && (
                      <View style={styles.pollBox}>
                        <View style={styles.pollHeadingRow}>
                          <Text style={styles.pollHeading}>Interactive Poll</Text>
                          <Text style={styles.pollActiveTag}>Active Voting</Text>
                        </View>
                        {pollOpts.map((opt: string, idx: number) => {
                          const isSelected = userVotedChoice === idx;
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[
                                styles.pollOptionBtn,
                                {
                                  backgroundColor: isSelected ? colors.card : colors.surface,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                              onPress={() => handleVotePoll(post.id, idx)}
                              accessibilityRole="button"
                              accessibilityLabel={`Vote for ${opt}`}
                            >
                              <Text
                                style={{
                                  fontSize: typography.caption.fontSize,
                                  lineHeight: typography.caption.lineHeight,
                                  color: colors.text,
                                  fontWeight: isSelected ? '700' : '500',
                                }}
                              >
                                {opt}
                              </Text>
                              {isSelected && <Check size={14} color={colors.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* Action Bar: Likes, Comments, Bookmark, Share */}
                    <View style={styles.actionBar}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleLikePost(post.id, serverLiked)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Like post"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Heart
                          size={18}
                          color={isLiked ? colors.danger : colors.textMuted}
                          fill={isLiked ? colors.danger : 'transparent'}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: isLiked ? colors.danger : colors.textMuted },
                          ]}
                        >
                          {likesCount}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() =>
                          setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                        }
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="View comments"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MessageSquare size={18} color={colors.textMuted} />
                        <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>
                          {post.comments?.length || 0}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleBookmarkPost(post.id, serverBookmarked)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Bookmark post"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Bookmark
                          size={18}
                          color={isBookmarked ? colors.primary : colors.textMuted}
                          fill={isBookmarked ? colors.primary : 'transparent'}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleSharePost(post)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Share post"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Share2 size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    {/* Shared Interactive TikTok-Style Comment System */}
                    {activeCommentPostId === post.id && (
                      <View style={{ marginTop: spacing.sm, height: 380, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                        <CommentSection
                          contextType="post"
                          targetId={post.id}
                          sessionToken={sessionToken}
                          currentUser={dbUser}
                          onRequireAuth={onRequireAuth}
                          title="Post Comments"
                          subtitle={post.title}
                        />
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon={<Compass size={36} color={colors.primary} />}
              title="No Updates Found"
              description={
                readerFeedTab === 'following'
                  ? 'Follow creators to see their latest illustrations, novels, and polls here.'
                  : 'Be the first to explore discover & featured creator updates.'
              }
              actionLabel={readerFeedTab === 'following' ? 'Explore Discover Feed' : undefined}
              onAction={readerFeedTab === 'following' ? () => setReaderFeedTab('discover') : undefined}
            />
          )}
        </View>
      </ScrollView>

      {/* Creator Studio Sticker Packs Manager Modal */}
      <Modal
        visible={showStickerManager}
        animationType="slide"
        onRequestClose={() => setShowStickerManager(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: '#1e293b',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
              Creator Studio • Sticker Packs
            </Text>
            <TouchableOpacity
              onPress={() => setShowStickerManager(false)}
              style={{ padding: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Close Sticker Manager"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          <StickerManagerView />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: typography.h2.fontWeight,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  createPostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  createPostPillText: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  feedTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  feedTabBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  feedTabText: {
    fontSize: typography.small.fontSize,
  },
  tagBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  feedContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  postAuthorName: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  postFollowBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postFollowText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  postDate: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  postTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: typography.h3.fontWeight,
    color: colors.text,
  },
  postBody: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    color: colors.textMuted,
  },
  postMediaContainer: {
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 200,
    backgroundColor: colors.surface,
  },
  postMediaImg: {
    width: '100%',
    height: '100%',
  },
  pollBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  pollHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  pollHeading: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  pollActiveTag: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    fontWeight: '700',
  },
  pollOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
  },
  actionBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
  commentSection: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  commentAuthor: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  commentBody: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  commentInput: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.caption.fontSize,
    color: colors.text,
  },
  sendCommentBtn: {
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  sendCommentBtnText: {
    color: colors.text,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  emptyFeedBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyFeedTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: typography.h2.fontWeight,
    color: colors.text,
  },
  emptyFeedSub: {
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    textAlign: 'center',
    color: colors.textMuted,
  },
});
