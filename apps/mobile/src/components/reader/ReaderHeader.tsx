import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeftIcon } from '../common/Icons';

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
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.header }]}>
      <View style={[styles.headerContainer, { borderBottomColor: colors.borderSubtle }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back to series details"
        >
          <ChevronLeftIcon size={22} color={colors.text} />
          <Text style={[styles.backLabel, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>

        {/* Center Title & Chapter Index */}
        <View style={styles.titleContainer}>
          <Text style={[styles.seriesTitleText, { color: colors.text }]} numberOfLines={1}>
            {seriesTitle || 'Series'}
          </Text>
          <Text style={[styles.chapterInfoText, { color: colors.textMuted }]} numberOfLines={1}>
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
    height: Platform.OS === 'ios' ? 44 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
    minWidth: 60,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  seriesTitleText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  chapterInfoText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
    textAlign: 'center',
  },
  rightSpacer: {
    minWidth: 60,
  },
});
