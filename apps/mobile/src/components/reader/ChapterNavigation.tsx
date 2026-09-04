import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bookmark,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';

export interface ChapterNavigationProps {
  progressPct: number; // 0 to 100
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenComments: () => void;
  commentCount: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

/**
 * Bottom chapter navigation bar for Panelva Reader.
 */
export function ChapterNavigation({
  progressPct,
  hasPrevChapter,
  hasNextChapter,
  onPrevChapter,
  onNextChapter,
  onOpenComments,
  commentCount,
  isBookmarked,
  onToggleBookmark,
}: ChapterNavigationProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
      <View style={[styles.navContainer, { borderTopColor: colors.border }]}>
        {/* Previous Chapter */}
        <TouchableOpacity
          style={[styles.navBtn, !hasPrevChapter && styles.disabledBtn]}
          onPress={onPrevChapter}
          disabled={!hasPrevChapter}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Previous Chapter"
        >
          <ChevronLeft size={20} color={hasPrevChapter ? colors.text : colors.textMuted} />
          <Text style={[styles.navBtnText, { color: hasPrevChapter ? colors.text : colors.textMuted }]}>
            Prev
          </Text>
        </TouchableOpacity>

        {/* Center Actions: Progress %, Comments, Bookmark */}
        <View style={styles.centerActionsRow}>
          {/* Progress Indicator */}
          <View style={[styles.progressPill, { backgroundColor: colors.surface }]}>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {Math.round(progressPct)}% Read
            </Text>
          </View>

          {/* Comments Modal Trigger */}
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: colors.surface }]}
            onPress={onOpenComments}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Comments"
          >
            <MessageSquare size={16} color={colors.text} />
            {commentCount > 0 && (
              <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                {commentCount > 99 ? '99+' : commentCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Bookmark Trigger */}
          <TouchableOpacity
            style={[
              styles.iconActionBtn,
              {
                backgroundColor: isBookmarked ? colors.card : colors.surface,
                borderColor: isBookmarked ? colors.primary : colors.border,
              },
            ]}
            onPress={onToggleBookmark}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Bookmark Series"
          >
            <Bookmark size={16} color={isBookmarked ? colors.primary : colors.text} />
          </TouchableOpacity>
        </View>

        {/* Next Chapter */}
        <TouchableOpacity
          style={[styles.navBtn, !hasNextChapter && styles.disabledBtn]}
          onPress={onNextChapter}
          disabled={!hasNextChapter}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Next Chapter"
        >
          <Text style={[styles.navBtnText, { color: hasNextChapter ? colors.text : colors.textMuted }]}>
            Next
          </Text>
          <ChevronRight size={20} color={hasNextChapter ? colors.text : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 50,
  },
  navContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  disabledBtn: {
    opacity: 0.35,
  },
  navBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  centerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
  },
});
