import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, typography } from '@panelva/theme';

export interface ReaderHeaderProps {
  seriesTitle: string;
  chapterIndex: number;
  chapterTitle?: string | null;
  onBack: () => void;
}

/**
 * Minimal, distraction-free Header for Panelva Reader.
 * Displays only Back navigation, Series title, and Chapter info.
 * Contains ZERO format switching, theme switches, or profile icons.
 */
export function ReaderHeader({
  seriesTitle,
  chapterIndex,
  chapterTitle,
  onBack,
}: ReaderHeaderProps) {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to series details"
        >
          <ChevronLeft size={22} color={colors.text} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        {/* Center Title & Chapter Index */}
        <View style={styles.titleContainer}>
          <Text style={styles.seriesTitleText} numberOfLines={1}>
            {seriesTitle || 'Series'}
          </Text>
          <Text style={styles.chapterInfoText} numberOfLines={1}>
            Chapter {chapterIndex}{chapterTitle ? ` • ${chapterTitle}` : ''}
          </Text>
        </View>

        {/* Spacer for symmetry */}
        <View style={styles.rightSpacer} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 50,
  },
  headerContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    minWidth: 64,
  },
  backLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  seriesTitleText: {
    fontSize: typography.small.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  chapterInfoText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
  rightSpacer: {
    minWidth: 64,
  },
});
