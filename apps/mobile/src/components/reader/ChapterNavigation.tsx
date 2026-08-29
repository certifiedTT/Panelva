import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  BookmarkIcon,
} from '../common/Icons';

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
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
      <View style={[styles.navContainer, { borderTopColor: colors.borderSubtle }]}>
        {/* Previous Chapter */}
        <TouchableOpacity
          style={[styles.navBtn, !hasPrevChapter && styles.disabledBtn]}
          onPress={onPrevChapter}
          disabled={!hasPrevChapter}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Previous Chapter"
        >
          <ChevronLeftIcon size={20} color={hasPrevChapter ? colors.text : colors.textMuted} />
          <Text style={[styles.navBtnText, { color: hasPrevChapter ? colors.text : colors.textMuted }]}>
            Prev
          </Text>
        </TouchableOpacity>

        {/* Center Actions: Progress %, Comments, Bookmark */}
        <View style={styles.centerActionsRow}>
          {/* Progress Indicator */}
          <View style={[styles.progressPill, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {Math.round(progressPct)}% Read
            </Text>
          </View>

          {/* Comments Modal Trigger */}
          <TouchableOpacity
            style={[styles.iconActionBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={onOpenComments}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open Comments"
          >
            <MessageSquareIcon size={16} color={colors.text} />
            {commentCount > 0 && (
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {commentCount > 99 ? '99+' : commentCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Bookmark Trigger */}
          <TouchableOpacity
            style={[
              styles.iconActionBtn,
              { backgroundColor: isBookmarked ? 'rgba(37, 99, 235, 0.15)' : colors.surfaceElevated },
            ]}
            onPress={onToggleBookmark}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Bookmark Series"
          >
            <BookmarkIcon size={16} color={isBookmarked ? colors.primary : colors.text} />
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
          <ChevronRightIcon size={20} color={hasNextChapter ? colors.text : colors.textMuted} />
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  disabledBtn: {
    opacity: 0.35,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
