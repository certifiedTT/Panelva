import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  CloseIcon,
  HeartIcon,
  SparklesIcon,
  CrownIcon,
  CheckIcon,
  TrashIcon,
} from '../common/Icons';

interface ChapterCommentsModalProps {
  visible: boolean;
  onClose: () => void;
  chapterId: string | null;
  chapterIndex?: number;
  seriesTitle?: string;
  sessionToken: string | null;
  dbUser: any;
  onRequireAuth: () => void;
  onViewCreatorProfile?: (creatorProfileId: string) => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '😱', '👏', '👑', '✨', '😂', '💀'];

export function ChapterCommentsModal({
  visible,
  onClose,
  chapterId,
  chapterIndex,
  seriesTitle,
  sessionToken,
  dbUser,
  onRequireAuth,
  onViewCreatorProfile,
}: ChapterCommentsModalProps) {
  const { colors } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});

  // Query live comments for this chapter
  const { data: dbComments, isLoading, refetch } = (trpc.chapter.getComments as any).useQuery(
    { chapterId: chapterId!, limit: 50 },
    { enabled: visible && !!chapterId, retry: false }
  );

  // Post comment mutation
  const postCommentMutation = trpc.chapter.postComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      setReplyingToUser(null);
      refetch();
    },
    onError: (err) => Alert.alert('Post Error', err.message),
  });

  const handleSendComment = () => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    if (!chapterId || !commentText.trim()) return;

    let finalContent = commentText.trim();
    if (replyingToUser && !finalContent.startsWith(`@${replyingToUser}`)) {
      finalContent = `@${replyingToUser} ${finalContent}`;
    }

    postCommentMutation.mutate({
      chapterId,
      content: finalContent,
    });
  };

  const handleToggleLike = (commentId: string) => {
    if (!sessionToken) {
      onRequireAuth();
      return;
    }
    setLikedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleInsertEmoji = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  const commentsList = dbComments || [
    {
      id: 'c-1',
      userId: 'u-1',
      content: 'That panel transition at the climax was unbelievable! Outstanding artwork.',
      priorityScore: 3,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      user: { username: 'LunaBlade', role: 'CREATOR', subscription: 'PREMIUM' },
    },
    {
      id: 'c-2',
      userId: 'u-2',
      content: 'I need the next episode immediately. Who else thinks the mysterious mage is actually the emperor?',
      priorityScore: 1,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      user: { username: 'MangaEnthusiast', role: 'USER', subscription: 'PLUS' },
    },
    {
      id: 'c-3',
      userId: 'u-3',
      content: 'Panelva reader on mobile feels so much smoother now!',
      priorityScore: 0,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      user: { username: 'WebtoonReader', role: 'USER', subscription: 'NONE' },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Chapter Comments</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.primaryMuted }]}>
                  <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                    {commentsList.length}
                  </Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {seriesTitle ? `${seriesTitle} • ` : ''}Chapter {chapterIndex || 1}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <CloseIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Comments Feed */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : commentsList.length > 0 ? (
              <View style={{ gap: 12 }}>
                {commentsList.map((c: any) => {
                  const isCreator = c.user?.role === 'CREATOR';
                  const isAdmin = c.user?.role === 'ADMIN' || c.user?.role === 'MASTER_ADMIN';
                  const isPremium = c.user?.subscription === 'PREMIUM';
                  const isPlus = c.user?.subscription === 'PLUS';
                  const isLiked = !!likedCommentIds[c.id];
                  const isOwnComment = dbUser?.id && c.userId === dbUser.id;

                  // Format relative timestamp
                  let timeStr = 'recently';
                  if (c.createdAt) {
                    const diffMs = Date.now() - new Date(c.createdAt).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    if (diffMins < 60) timeStr = `${Math.max(1, diffMins)}m ago`;
                    else if (diffHours < 24) timeStr = `${diffHours}h ago`;
                    else timeStr = `${diffDays}d ago`;
                  }

                  return (
                    <View
                      key={c.id}
                      style={[
                        styles.commentCard,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: c.priorityScore > 1 ? colors.primaryLight : colors.border,
                        },
                      ]}
                    >
                      {/* Author row */}
                      <View style={styles.authorRow}>
                        <View
                          style={[
                            styles.avatarCircle,
                            {
                              backgroundColor: isCreator
                                ? colors.primary
                                : isAdmin
                                ? colors.accentGold
                                : colors.surfaceSecondary,
                            },
                          ]}
                        >
                          <Text style={styles.avatarLetter}>
                            {(c.user?.username || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Text style={[styles.usernameText, { color: colors.text }]}>
                              @{c.user?.username || 'Reader'}
                            </Text>

                            {isCreator && (
                              <View style={[styles.roleBadge, { backgroundColor: colors.primaryMuted }]}>
                                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Creator</Text>
                              </View>
                            )}

                            {isAdmin && (
                              <View style={[styles.roleBadge, { backgroundColor: colors.accentGoldMuted }]}>
                                <Text style={[styles.roleBadgeText, { color: colors.accentGold }]}>Staff</Text>
                              </View>
                            )}

                            {isPremium && !isCreator && !isAdmin && (
                              <View style={[styles.roleBadge, { backgroundColor: colors.accentGoldMuted }]}>
                                <CrownIcon size={10} color={colors.accentGold} />
                                <Text style={[styles.roleBadgeText, { color: colors.accentGold }]}>Plus</Text>
                              </View>
                            )}

                            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeStr}</Text>
                          </View>
                        </View>

                        {/* Actions */}
                        <TouchableOpacity
                          style={styles.likeBtn}
                          onPress={() => handleToggleLike(c.id)}
                          activeOpacity={0.7}
                        >
                          <HeartIcon
                            size={16}
                            color={isLiked ? colors.error : colors.textMuted}
                            filled={isLiked}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Content */}
                      <Text style={[styles.commentBody, { color: colors.textSecondary }]}>
                        {c.content}
                      </Text>

                      {/* Reply shortcut */}
                      <View style={styles.commentFooter}>
                        <TouchableOpacity
                          onPress={() => {
                            setReplyingToUser(c.user?.username || 'Reader');
                            setCommentText(`@${c.user?.username || 'Reader'} `);
                          }}
                          style={styles.replyAction}
                        >
                          <Text style={[styles.replyActionText, { color: colors.primary }]}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <SparklesIcon size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No comments yet</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Be the first to share your reaction to this episode!
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Quick Reaction Emojis Strip */}
          <View style={[styles.emojiStrip, { borderTopColor: colors.borderSubtle }]}>
            {QUICK_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiBtn}
                onPress={() => handleInsertEmoji(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Replying banner indicator */}
          {replyingToUser && (
            <View style={[styles.replyingBanner, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[styles.replyingText, { color: colors.primary }]}>
                Replying to @{replyingToUser}
              </Text>
              <TouchableOpacity onPress={() => setReplyingToUser(null)}>
                <CloseIcon size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text },
              ]}
              placeholder={sessionToken ? 'Join the discussion...' : 'Sign in to comment...'}
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: commentText.trim() ? colors.primary : colors.surfaceSecondary,
                  opacity: commentText.trim() ? 1 : 0.6,
                },
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || postCommentMutation.isLoading}
              activeOpacity={0.8}
            >
              {postCommentMutation.isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.sendBtnText,
                    { color: commentText.trim() ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    height: '75%',
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
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  commentCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  usernameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 3,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
  },
  likeBtn: {
    padding: 4,
  },
  commentBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  replyAction: {
    paddingVertical: 2,
  },
  replyActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  emojiStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 18,
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  replyingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  sendBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
