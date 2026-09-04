import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { X, MessageSquare } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { CommentSection } from '../comments/CommentSection';
import { radius, spacing } from '@panelva/theme';

export interface ChapterCommentsModalProps {
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

export function ChapterCommentsModal({
  visible,
  onClose,
  chapterId,
  chapterIndex,
  seriesTitle,
  sessionToken,
  dbUser,
  onRequireAuth,
}: ChapterCommentsModalProps) {
  const { colors } = useTheme();

  if (!chapterId) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header Bar */}
          <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Chapter Discussion</Text>
                <View style={styles.chapterBadge}>
                  <Text style={styles.chapterBadgeText}>Ch. {chapterIndex || 1}</Text>
                </View>
              </View>
              {seriesTitle ? (
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {seriesTitle}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Shared Interactive TikTok-Style Comment System */}
          <View style={styles.commentSectionWrapper}>
            <CommentSection
              contextType="chapter"
              targetId={chapterId}
              sessionToken={sessionToken}
              currentUser={dbUser}
              onRequireAuth={onRequireAuth}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  chapterBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  chapterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
  },
  closeBtn: {
    padding: 6,
  },
  commentSectionWrapper: {
    flex: 1,
  },
});
