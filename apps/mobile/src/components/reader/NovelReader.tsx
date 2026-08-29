import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Chapter } from '../../types';
import { ChevronRightIcon } from '../common/Icons';

export interface NovelReaderProps {
  chapter: Chapter;
  textContent: string | null;
  onScrollProgress: (progress: number) => void;
  onToggleControls: () => void;
  onNextChapter?: () => void;
  hasNextChapter: boolean;
  nextChapterTitle?: string | null;
}

/**
 * High-performance typography-optimized Novel & Light Novel text manuscript reader.
 */
export function NovelReader({
  chapter,
  textContent,
  onScrollProgress,
  onToggleControls,
  onNextChapter,
  hasNextChapter,
}: NovelReaderProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [fontSize, setFontSize] = useState<number>(17);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      const progress = contentOffset.y / maxScroll;
      onScrollProgress(Math.min(Math.max(progress, 0), 1));
    }
  };

  const paragraphs = (textContent || '').split('\n').filter((p) => p.trim().length > 0);

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 13));

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.contentContainer}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity activeOpacity={1} onPress={onToggleControls} style={styles.canvasTouchable}>
        {/* Typography Formatting Bar */}
        <View style={[styles.typographyBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.typographyLabel, { color: colors.textMuted }]}>Text Size</Text>
          <View style={styles.fontSizeControlsRow}>
            <TouchableOpacity
              style={[styles.fontBtn, { borderColor: colors.border }]}
              onPress={decreaseFontSize}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontBtnText, { color: colors.text }]}>A-</Text>
            </TouchableOpacity>
            <Text style={[styles.fontSizeDisplay, { color: colors.text }]}>{fontSize}px</Text>
            <TouchableOpacity
              style={[styles.fontBtn, { borderColor: colors.border }]}
              onPress={increaseFontSize}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontBtnText, { color: colors.text }]}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chapter Header in Manuscript */}
        <View style={styles.chapterHeader}>
          <Text style={[styles.chapterNumberLabel, { color: colors.primary }]}>
            CHAPTER {chapter.chapterIndex}
          </Text>
          <Text style={[styles.chapterTitleLabel, { color: colors.text }]}>
            {chapter.title || `Episode ${chapter.chapterIndex}`}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
        </View>

        {/* Paragraphs */}
        <View style={styles.manuscriptBody}>
          {paragraphs.length > 0 ? (
            paragraphs.map((para, idx) => (
              <Text
                key={`p-${idx}`}
                style={[
                  styles.paragraphText,
                  {
                    color: colors.text,
                    fontSize,
                    lineHeight: Math.round(fontSize * 1.7),
                  },
                ]}
              >
                {para}
              </Text>
            ))
          ) : (
            <Text style={[styles.paragraphText, { color: colors.textMuted, fontSize }]}>
              {textContent || 'Manuscript content loading...'}
            </Text>
          )}
        </View>

        {/* End of Chapter Section */}
        <View style={[styles.endOfChapterCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.endOfChapterTitle, { color: colors.text }]}>
            End of Chapter {chapter.chapterIndex}
          </Text>
          <Text style={[styles.endOfChapterSubtitle, { color: colors.textMuted }]}>
            You have finished reading this chapter.
          </Text>

          {hasNextChapter && onNextChapter && (
            <TouchableOpacity
              style={[styles.nextChapterBtn, { backgroundColor: colors.primary }]}
              onPress={onNextChapter}
              activeOpacity={0.85}
            >
              <Text style={styles.nextChapterBtnText}>Read Next Chapter</Text>
              <ChevronRightIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  canvasTouchable: {
    width: '100%',
  },
  typographyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  typographyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fontSizeControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  fontBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fontSizeDisplay: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
  chapterHeader: {
    marginBottom: 24,
    gap: 6,
  },
  chapterNumberLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chapterTitleLabel: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  divider: {
    height: 1,
    marginTop: 12,
  },
  manuscriptBody: {
    gap: 18,
  },
  paragraphText: {
    letterSpacing: 0.15,
  },
  endOfChapterCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
  },
  endOfChapterTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  endOfChapterSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  nextChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
  },
  nextChapterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
