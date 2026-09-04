import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Sparkles, MessageSquare, X } from 'lucide-react-native';
import { colors, radius, spacing } from '@panelva/theme';
import { trpc } from '../../../lib/trpc';
import { CommentCard, CommentData } from './CommentCard';
import { ReplyThread } from './ReplyThread';
import { CommentComposer } from './CommentComposer';
import { StickerPickerModal, PickerTab } from './StickerPickerModal';
import { GiftDrawer, GiftItem } from './GiftDrawer';
import { GiftAnimationLayer } from './GiftAnimationLayer';
import { GiftAnnouncement } from './GiftAnnouncement';

export interface CommentSectionProps {
  contextType: 'chapter' | 'post';
  targetId: string;
  sessionToken?: string | null;
  currentUser?: any;
  onRequireAuth?: () => void;
  title?: string;
  subtitle?: string;
}

export function CommentSection({
  contextType,
  targetId,
  sessionToken,
  currentUser,
  onRequireAuth,
  title,
  subtitle,
}: CommentSectionProps) {
  // Composer State
  const [commentText, setCommentText] = useState('');
  const [attachedSticker, setAttachedSticker] = useState<any | null>(null);
  const [attachedGif, setAttachedGif] = useState<any | null>(null);
  const [attachedGift, setAttachedGift] = useState<GiftItem | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);

  // Drawers Visibility State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTab, setMediaPickerTab] = useState<PickerTab>('recent');
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false);

  // Animation & Celebrations State
  const [activeGiftTier, setActiveGiftTier] = useState<0 | 1 | 2 | 3>(0);
  const [latestAnnouncement, setLatestAnnouncement] = useState<{
    senderUsername: string;
    giftName: string;
    credits: number;
  } | null>(null);

  // Likes Tracking State
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});

  // User credit balance
  const userCredits = currentUser?.wCoinBalance ?? currentUser?.creditsBalance ?? 350;

  // Chapter queries & mutations
  const isChapter = contextType === 'chapter';
  const {
    data: chapterCommentsData,
    isLoading: isChapterLoading,
    refetch: refetchChapterComments,
  } = (trpc.chapter.getComments as any).useQuery(
    { chapterId: targetId, limit: 50 },
    { enabled: isChapter && !!targetId, retry: false }
  );

  const postChapterCommentMutation = trpc.chapter.postComment.useMutation({
    onSuccess: (data: any) => {
      handleCommentSuccess(data);
      refetchChapterComments();
    },
    onError: (err) => Alert.alert('Comment Error', err.message),
  });

  const deleteChapterCommentMutation = ((trpc.chapter as any).deleteComment || (trpc.chapter as any).deleteCommentMutation)?.useMutation({
    onSuccess: () => {
      refetchChapterComments();
      Alert.alert('Comment Removed', 'Comment removed and reputation adjusted.');
    },
    onError: (err: any) => Alert.alert('Delete Error', err.message),
  });

  // Post queries & mutations
  const {
    data: postCommentsData,
    isLoading: isPostLoading,
    refetch: refetchPostComments,
  } = (trpc.post.getPostComments as any).useQuery(
    { postId: targetId },
    { enabled: !isChapter && !!targetId, retry: false }
  );

  const addPostCommentMutation = (trpc.post.addComment as any).useMutation({
    onSuccess: (data: any) => {
      handleCommentSuccess(data);
      refetchPostComments();
    },
    onError: (err: any) => Alert.alert('Comment Error', err.message),
  });

  const deletePostCommentMutation = (trpc.post.deleteComment as any).useMutation({
    onSuccess: () => {
      refetchPostComments();
      Alert.alert('Comment Removed', 'Comment removed.');
    },
    onError: (err: any) => Alert.alert('Delete Error', err.message),
  });

  const isSending = postChapterCommentMutation.isLoading || addPostCommentMutation.isLoading;
  const isLoading = isChapter ? isChapterLoading : isPostLoading;

  // Unified comments list
  const rawList = isChapter ? chapterCommentsData : postCommentsData;
  const commentsList: CommentData[] =
    rawList && rawList.length > 0
      ? rawList
      : [
          {
            id: 'c-demo-1',
            userId: 'u-demo-1',
            content: 'That panel transition at the climax was unbelievable! Outstanding artwork.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            priorityScore: 3,
            likesCount: 14,
            user: { username: 'LunaBlade', role: 'CREATOR', subscription: 'PREMIUM' },
            giftId: 'galaxy',
            giftCredits: 2000,
            giftTier: 1,
          },
          {
            id: 'c-demo-2',
            userId: 'u-demo-2',
            content: 'Who else noticed the secret sigil on the dagger? Masterpiece!',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            priorityScore: 2,
            likesCount: 8,
            stickerId: 't-flame',
            user: { username: 'MangaEnthusiast', role: 'USER', subscription: 'PLUS' },
          },
          {
            id: 'c-demo-3',
            userId: 'u-demo-3',
            content: 'System announcement: Official chapter discussion guidelines are in effect.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            priorityScore: 4,
            likesCount: 32,
            user: { username: 'notjud3', role: 'MASTER_ADMIN', subscription: 'PREMIUM' },
          },
        ];

  const handleCommentSuccess = (data: any) => {
    setCommentText('');
    setAttachedSticker(null);
    setAttachedGif(null);
    setAttachedGift(null);
    setReplyingTo(null);

    // If a high-tier gift was sent, activate localized animations & announcements
    const tier = data?.giftTier || 0;
    if (tier > 0) {
      setActiveGiftTier(tier);
      if (data?.giftCredits && data.giftCredits >= 2000) {
        setLatestAnnouncement({
          senderUsername: currentUser?.username || 'You',
          giftName: data.giftId ? data.giftId.toUpperCase() : 'Premium',
          credits: data.giftCredits,
        });
      }
    }

    Alert.alert('Comment Posted! ✨', '+5 Community Reputation points earned!');
  };

  const handleSendComment = () => {
    if (!sessionToken) {
      onRequireAuth?.();
      return;
    }
    if (!targetId) return;

    let finalContent = commentText.trim();
    if (!finalContent && (attachedSticker || attachedGif || attachedGift)) {
      finalContent = attachedSticker
        ? `Sent sticker: ${attachedSticker.name}`
        : attachedGif
        ? `Sent GIF: ${attachedGif.title || 'GIF'}`
        : `Sent gift: ${attachedGift?.name}`;
    }
    if (!finalContent) return;

    if (replyingTo && !finalContent.startsWith(`@${replyingTo.user?.username}`)) {
      finalContent = `@${replyingTo.user?.username} ${finalContent}`;
    }

    const payload = {
      content: finalContent,
      stickerId: attachedSticker?.id || null,
      gifId: attachedGif?.id || null,
      gifUrl: attachedGif?.url || attachedGif?.previewUrl || null,
      giftId: attachedGift?.id || null,
      giftCredits: attachedGift?.credits || 0,
    };

    if (isChapter) {
      postChapterCommentMutation.mutate({
        chapterId: targetId,
        ...payload,
      });
    } else {
      addPostCommentMutation.mutate({
        postId: targetId,
        parentId: replyingTo?.id || null,
        ...payload,
      });
    }
  };

  const handleToggleLike = (commentId: string) => {
    if (!sessionToken) {
      onRequireAuth?.();
      return;
    }
    setLikedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment? Any reputation points earned will be revoked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (isChapter) {
              deleteChapterCommentMutation.mutate({ commentId });
            } else {
              deletePostCommentMutation.mutate({ commentId });
            }
          },
        },
      ]
    );
  };

  const handleReplyTo = (comment: CommentData) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.user?.username || 'Reader'} `);
  };

  return (
    <View style={styles.container}>
      {/* Animation wrapper layer for Tier 1-3 localized effects */}
      <GiftAnimationLayer activeTier={activeGiftTier} onAnimationComplete={() => setActiveGiftTier(0)}>
        {/* Header (optional) */}
        {(title || subtitle) && (
          <View style={styles.headerRow}>
            <View>
              {title && <Text style={styles.headerTitle}>{title}</Text>}
              {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.countBadge}>
              <MessageSquare size={12} color="#60A5FA" />
              <Text style={styles.countText}>{commentsList.length}</Text>
            </View>
          </View>
        )}

        {/* High-value Gift Announcement Card (injected for gifts >= 2,000 Credits) */}
        {latestAnnouncement && (
          <GiftAnnouncement
            senderUsername={latestAnnouncement.senderUsername}
            giftName={latestAnnouncement.giftName}
            credits={latestAnnouncement.credits}
          />
        )}

        {/* Replying To Banner */}
        {replyingTo && (
          <View style={styles.replyingBanner}>
            <Text style={styles.replyingText}>
              Replying to @{replyingTo.user?.username || 'Reader'}
            </Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <X size={14} color="#60A5FA" />
            </TouchableOpacity>
          </View>
        )}

        {/* Comments Feed */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : commentsList.length > 0 ? (
            <View style={styles.commentsList}>
              {commentsList.map((c) => (
                <View key={c.id}>
                  <CommentCard
                    comment={c}
                    currentUserId={currentUser?.id}
                    isLiked={!!likedCommentIds[c.id]}
                    onToggleLike={handleToggleLike}
                    onReply={handleReplyTo}
                    onDelete={handleDeleteComment}
                  />

                  {/* Threaded Nested Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <ReplyThread
                      parentCommentId={c.id}
                      replies={c.replies}
                      currentUserId={currentUser?.id}
                      likedCommentIds={likedCommentIds}
                      onToggleLike={handleToggleLike}
                      onReply={handleReplyTo}
                      onDelete={handleDeleteComment}
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Sparkles size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share your reaction, sticker, or gift!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* TikTok-style Interaction Bar Composer with Single Attachment Support */}
        <CommentComposer
          commentText={commentText}
          onChangeText={setCommentText}
          onSend={handleSendComment}
          onOpenStickerPicker={() => {
            setMediaPickerTab('recent');
            setIsMediaPickerOpen(true);
          }}
          onOpenGifPicker={() => {
            setMediaPickerTab('gifs');
            setIsMediaPickerOpen(true);
          }}
          onOpenGiftDrawer={() => setIsGiftDrawerOpen(true)}
          attachedSticker={attachedSticker}
          onRemoveSticker={() => setAttachedSticker(null)}
          attachedGif={attachedGif}
          onRemoveGif={() => setAttachedGif(null)}
          attachedGift={attachedGift}
          onRemoveGift={() => setAttachedGift(null)}
          isSending={isSending}
          placeholder={sessionToken ? 'Join the discussion...' : 'Sign in to comment...'}
        />

        {/* 5-Tab Unified Sticker & GIF Picker Modal */}
        <StickerPickerModal
          visible={isMediaPickerOpen}
          initialTab={mediaPickerTab}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelectSticker={(sticker) => {
            setAttachedSticker(sticker);
            setAttachedGif(null); // Single attachment rule: clear gif
          }}
          onSelectGif={(gif) => {
            setAttachedGif(gif);
            setAttachedSticker(null); // Single attachment rule: clear sticker
          }}
        />

        {/* Gift Drawer Sheet */}
        <GiftDrawer
          visible={isGiftDrawerOpen}
          onClose={() => setIsGiftDrawerOpen(false)}
          userCredits={userCredits}
          onSendGift={(gift) => {
            setAttachedGift(gift);
          }}
        />
      </GiftAnimationLayer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA',
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 99, 235, 0.25)',
  },
  replyingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  commentsList: {
    gap: spacing.xs,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
  },
});
