import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface ReaderProgressBarProps {
  progress: number; // 0 to 1
}

/**
 * Top horizontal scroll progress indicator for Panelva Reader.
 */
export function ReaderProgressBar({ progress }: ReaderProgressBarProps) {
  const { colors } = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: colors.primary,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    width: '100%',
    zIndex: 49,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
