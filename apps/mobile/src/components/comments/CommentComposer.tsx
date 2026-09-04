import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Smile, Sparkles, Image as ImageIcon, Gift, Send, X } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { radius, spacing } from '@panelva/theme';
import { StickerItem } from './StickerDrawer';
import { GiftItem } from './GiftDrawer';

export interface CommentComposerProps {
  commentText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onOpenEmojiPicker?: () => void;
  onOpenStickerPicker: () => void;
  onOpenGifPicker: () => void;
  onOpenGiftDrawer?: () => void;
  attachedSticker?: any | null;
  onRemoveSticker?: () => void;
  attachedGif?: any | null;
  onRemoveGif?: () => void;
  attachedGift?: GiftItem | null;
  onRemoveGift?: () => void;
  isSending?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function CommentComposer({
  commentText,
  onChangeText,
  onSend,
  onOpenEmojiPicker,
  onOpenStickerPicker,
  onOpenGifPicker,
  onOpenGiftDrawer,
  attachedSticker,
  onRemoveSticker,
  attachedGif,
  onRemoveGif,
  attachedGift,
  onRemoveGift,
  isSending = false,
  placeholder = 'Join the discussion...',
  disabled = false,
}: CommentComposerProps) {
  const hasAttachment = Boolean(attachedSticker || attachedGif || attachedGift);
  const canSend = (commentText.trim().length > 0 || hasAttachment) && !isSending;

  return (
    <View style={styles.outerContainer}>
      {/* Attachment Previews */}
      {hasAttachment && (
        <View style={styles.attachmentBar}>
          {attachedSticker && (
            <View style={styles.attachmentChip}>
              {attachedSticker.imageUrl ? (
                <ExpoImage source={{ uri: attachedSticker.imageUrl }} style={styles.chipThumbnail} />
              ) : attachedSticker.icon ? (
                React.createElement(attachedSticker.icon, { size: 14, color: attachedSticker.color })
              ) : (
                <ImageIcon size={14} color="#60A5FA" />
              )}
              <Text style={styles.attachmentLabel} numberOfLines={1}>
                Sticker: {attachedSticker.name}
              </Text>
              <TouchableOpacity onPress={onRemoveSticker} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          {attachedGif && (
            <View style={[styles.attachmentChip, styles.gifChip]}>
              <ExpoImage source={{ uri: attachedGif.previewUrl || attachedGif.url }} style={styles.chipThumbnail} />
              <Text style={[styles.attachmentLabel, { color: '#38BDF8' }]} numberOfLines={1}>
                GIF: {attachedGif.title || 'Attached GIF'}
              </Text>
              <TouchableOpacity onPress={onRemoveGif} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}

          {attachedGift && (
            <View style={[styles.attachmentChip, styles.giftChip]}>
              {React.createElement(attachedGift.icon, { size: 14, color: attachedGift.color })}
              <Text style={[styles.attachmentLabel, { color: '#FBBF24' }]}>
                Gift: {attachedGift.name} ({attachedGift.credits} Credits)
              </Text>
              <TouchableOpacity onPress={onRemoveGift} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <X size={12} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Main Composer Bar */}
      <View style={styles.barContainer}>
        {/* Text Input Pill */}
        <View style={styles.inputPill}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            value={commentText}
            onChangeText={onChangeText}
            multiline
            maxLength={500}
            editable={!disabled}
          />
        </View>

        {/* Emoji Trigger */}
        <TouchableOpacity
          style={styles.circularButton}
          onPress={onOpenEmojiPicker || onOpenStickerPicker}
          activeOpacity={0.7}
          disabled={disabled}
          accessibilityLabel="Open Emojis"
        >
          <Smile size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Sticker Picker Trigger */}
        <TouchableOpacity
          style={[styles.circularButton, attachedSticker && styles.activeButton]}
          onPress={onOpenStickerPicker}
          activeOpacity={0.7}
          disabled={disabled}
          accessibilityLabel="Open Stickers"
        >
          <ImageIcon size={18} color={attachedSticker ? '#60A5FA' : '#9CA3AF'} />
        </TouchableOpacity>

        {/* GIF Picker Trigger */}
        <TouchableOpacity
          style={[styles.circularButton, attachedGif && styles.activeGifButton]}
          onPress={onOpenGifPicker}
          activeOpacity={0.7}
          disabled={disabled}
          accessibilityLabel="Open GIFs"
        >
          <Sparkles size={18} color={attachedGif ? '#38BDF8' : '#9CA3AF'} />
        </TouchableOpacity>

        {/* Gift Trigger (if provided) */}
        {onOpenGiftDrawer && (
          <TouchableOpacity
            style={[styles.circularButton, attachedGift && styles.activeGiftButton]}
            onPress={onOpenGiftDrawer}
            activeOpacity={0.7}
            disabled={disabled}
            accessibilityLabel="Open Gifts"
          >
            <Gift size={18} color={attachedGift ? '#F59E0B' : '#9CA3AF'} />
          </TouchableOpacity>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.circularButton, styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={!canSend || disabled}
          activeOpacity={0.8}
          accessibilityLabel="Publish comment"
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#0B1220',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  attachmentBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1F2937',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#374151',
  },
  giftChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  attachmentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  inputPill: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    minHeight: 38,
    maxHeight: 90,
    justifyContent: 'center',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 6,
  },
  circularButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  activeGiftButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  sendButton: {
    backgroundColor: '#2563EB',
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
});
