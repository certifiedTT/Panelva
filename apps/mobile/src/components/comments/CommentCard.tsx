import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Heart, MessageSquare, Trash2, Coins, Sparkles } from 'lucide-react-native';
import { radius, spacing } from '@panelva/theme';
import { RoleBadge } from './RoleBadge';
import { STICKER_CATALOG } from './StickerDrawer';
import { GIFT_CATALOG } from './GiftDrawer';

export interface CommentData {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  stickerId?: string | null;
  giftId?: string | null;
  giftCredits?: number | null;
  giftTier?: 0 | 1 | 2 | 3 | null;
  priorityScore?: number;
  likesCount?: number;
  user?: {
    username?: string;
    avatarUrl?: string | null;
    role?: string;
    subscription?: string;
  };
  replies?: CommentData[];
}

export interface CommentCardProps {
  comment: CommentData;
  currentUserId?: string;
  isLiked?: boolean;
  onToggleLike?: (commentId: string) => void;
  onReply?: (comment: CommentData) => void;
  onDelete?: (commentId: string) => void;
  onLongPressSticker?: (sticker: any) => void;
}

export function CommentCard({
  comment,
  currentUserId,
  isLiked = false,
  onToggleLike,
  onReply,
  onDelete,
  onLongPressSticker,
}: CommentCardProps) {
  const role = comment.user?.role || 'USER';
  const subscription = comment.user?.subscription || 'NONE';

  const isMasterAdmin = role === 'MASTER_ADMIN';
  const isAdmin = role === 'ADMIN' || role === 'MODERATOR';
  const isCreator = role === 'CREATOR' || role === 'VERIFIED_CREATOR';

  // Gift Tier animation logic
  const tier = comment.giftTier || 0;
  const isTier1 = tier === 1;
  const isHighTier = tier >= 1;

  const [tier1Active, setTier1Active] = useState(isTier1);
  const glowAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isTier1) {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.delay(4000),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start(() => setTier1Active(false));
    }
  }, [isTier1, glowAnim]);

  // Resolve attached sticker
  const attachedSticker = comment.stickerId
    ? STICKER_CATALOG.find((s) => s.id === comment.stickerId)
    : null;

  // Resolve attached gift
  const attachedGift = comment.giftId
    ? GIFT_CATALOG.find((g) => g.id === comment.giftId)
    : null;

  // Format relative timestamp
  let timeStr = 'just now';
  if (comment.createdAt) {
    const diffMs = Date.now() - new Date(comment.createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) timeStr = `${Math.max(1, diffMins)}m ago`;
    else if (diffHours < 24) timeStr = `${diffHours}h ago`;
    else timeStr = `${diffDays}d ago`;
  }

  // Determine role styling
  let roleCardStyle = styles.cardStandard;
  if (isMasterAdmin) {
    roleCardStyle = styles.cardMasterAdmin;
  } else if (isAdmin) {
    roleCardStyle = styles.cardAdmin;
  } else if (isCreator) {
    roleCardStyle = styles.cardCreator;
  }

  const isOwn = currentUserId && comment.userId === currentUserId;

  return (
    <View
      style={[
        styles.cardBase,
        roleCardStyle,
        isHighTier && styles.cardGiftHighlighted,
      ]}
    >
      {/* Gift Highlight Header (if high-tier gift attached) */}
      {attachedGift && attachedGift.credits >= 2000 && (
        <View style={styles.giftBadgeHeader}>
          <Sparkles size={12} color="#fbbf24" />
          <Text style={styles.giftBadgeHeaderText}>
            Gifted {attachedGift.name} ({attachedGift.credits.toLocaleString()} Credits)
          </Text>
        </View>
      )}

      {/* Author Row */}
      <View style={styles.authorRow}>
        {/* Avatar Circle */}
        <View
          style={[
            styles.avatarCircle,
            isMasterAdmin && { backgroundColor: '#ef4444' },
            isAdmin && { backgroundColor: '#3b82f6' },
            isCreator && { backgroundColor: '#10b981' },
          ]}
        >
          <Text style={styles.avatarInitial}>
            {(comment.user?.username || 'R').charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Username and Role Badges */}
        <View style={styles.nameMetaContainer}>
          <View style={styles.usernameRow}>
            <Text style={styles.usernameText}>@{comment.user?.username || 'Reader'}</Text>
            <RoleBadge role={role} subscription={subscription} size="sm" />
          </View>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>

        {/* Delete action */}
        {isOwn && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(comment.id)}
            style={styles.deleteButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Trash2 size={13} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Comment Body Content (hide placeholder text if sticker/gif only) */}
      {comment.content && comment.content !== '[Sticker]' && comment.content !== '[GIF]' ? (
        <Text style={styles.commentContent}>{comment.content}</Text>
      ) : null}

      {/* Attached Sticker (Supports DB Sticker image or Lucide catalog) */}
      {comment.stickerId && (
        <TouchableOpacity
          style={styles.attachedStickerContainer}
          activeOpacity={0.8}
          onLongPress={() =>
            onLongPressSticker?.({
              id: comment.stickerId,
              name: attachedSticker?.name || 'Sticker',
              color: attachedSticker?.color,
            })
          }
        >
          {attachedSticker ? (
            <View style={[styles.stickerPill, { borderColor: attachedSticker.color + '60' }]}>
              {React.createElement(attachedSticker.icon, { size: 20, color: attachedSticker.color })}
              <Text style={[styles.stickerPillText, { color: attachedSticker.color }]}>
                {attachedSticker.name}
              </Text>
            </View>
          ) : (
            <View style={styles.dbStickerBox}>
              <ExpoImage
                source={{ uri: `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80` }}
                style={styles.stickerImage}
                contentFit="contain"
              />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Attached Tenor GIF */}
      {(comment.gifUrl || comment.gifId) && (
        <View style={styles.attachedGifContainer}>
          <ExpoImage
            source={{ uri: comment.gifUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80' }}
            style={styles.gifImage}
            contentFit="cover"
          />
          <View style={styles.gifSourceBadge}>
            <Text style={styles.gifSourceText}>Tenor GIF</Text>
          </View>
        </View>
      )}

      {/* Attached Standard Gift Pill */}
      {attachedGift && attachedGift.credits < 2000 && (
        <View style={styles.standardGiftPill}>
          {React.createElement(attachedGift.icon, { size: 13, color: attachedGift.color })}
          <Text style={styles.standardGiftText}>
            Sent {attachedGift.name} ({attachedGift.credits} Credits)
          </Text>
          <Coins size={11} color="#fbbf24" />
        </View>
      )}

      {/* Card Actions Footer */}
      <View style={styles.footerRow}>
        {/* Reply Action */}
        <TouchableOpacity
          onPress={() => onReply?.(comment)}
          style={styles.replyButton}
          activeOpacity={0.7}
        >
          <MessageSquare size={13} color="#60A5FA" />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>

        {/* Like Action */}
        <TouchableOpacity
          onPress={() => onToggleLike?.(comment.id)}
          style={styles.likeButton}
          activeOpacity={0.7}
        >
          <Heart
            size={14}
            color={isLiked ? '#EF4444' : '#9CA3AF'}
            fill={isLiked ? '#EF4444' : 'transparent'}
          />
          <Text style={[styles.likeCountText, isLiked && { color: '#EF4444' }]}>
            {(comment.likesCount || 0) + (isLiked ? 1 : 0)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs + 2,
    borderWidth: 1,
  },
  cardStandard: {
    backgroundColor: '#171B26',
    borderColor: '#262D3D',
  },
  cardMasterAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  cardAdmin: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.45)',
  },
  cardCreator: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  cardGiftHighlighted: {
    borderColor: '#FBBF24',
    borderWidth: 1.5,
  },
  giftBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  giftBadgeHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.xs + 2,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  nameMetaContainer: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  usernameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 13,
    color: '#E5E7EB',
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  attachedStickerContainer: {
    marginBottom: spacing.xs,
  },
  stickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  stickerPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  standardGiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#374151',
  },
  standardGiftText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#60A5FA',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCountText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  dbStickerBox: {
    backgroundColor: '#1f2937',
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#374151',
  },
  stickerImage: {
    width: 64,
    height: 64,
    borderRadius: 6,
  },
  attachedGifContainer: {
    marginTop: spacing.xs + 2,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    maxWidth: 240,
    height: 140,
    position: 'relative',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  gifSourceBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  gifSourceText: {
    fontSize: 8,
    color: '#38BDF8',
    fontWeight: '700',
  },
});
