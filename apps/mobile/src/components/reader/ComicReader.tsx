import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { Chapter } from '../../types';
import { BookOpenIcon, ChevronRightIcon } from '../common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ComicReaderProps {
  chapter: Chapter;
  pages: Array<{ id: string; imageUrl: string; pageIndex: number; width?: number; height?: number }>;
  onScrollProgress: (progress: number) => void;
  onToggleControls: () => void;
  onNextChapter?: () => void;
  hasNextChapter: boolean;
  nextChapterTitle?: string | null;
}

/**
 * High-performance edge-to-edge Comic / Manhwa vertical webcomic reader.
 */
export function ComicReader({
  chapter,
  pages,
  onScrollProgress,
  onToggleControls,
  onNextChapter,
  hasNextChapter,
  nextChapterTitle,
}: ComicReaderProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      const progress = contentOffset.y / maxScroll;
      onScrollProgress(Math.min(Math.max(progress, 0), 1));
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: '#000000' }]}
      contentContainerStyle={styles.contentContainer}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity activeOpacity={1} onPress={onToggleControls} style={styles.canvasTouchable}>
        {/* Render Comic Pages in continuous vertical strip */}
        {pages && pages.length > 0 ? (
          pages.map((page, index) => {
            const aspect = page.width && page.height ? page.height / page.width : 1.45;
            const pageHeight = Math.round(SCREEN_WIDTH * aspect);

            return (
              <View key={page.id || `p-${index}`} style={[styles.pageWrapper, { minHeight: pageHeight }]}>
                <ExpoImage
                  source={{ uri: page.imageUrl }}
                  style={[styles.pageImage, { height: pageHeight }]}
                  contentFit="cover"
                  transition={150}
                  cachePolicy="memory-disk"
                />
              </View>
            );
          })
        ) : (
          <View style={styles.fallbackCanvas}>
            <BookOpenIcon size={48} color={colors.primary} />
            <Text style={[styles.fallbackTitle, { color: '#FFFFFF' }]}>Comic Pages Loading</Text>
            <Text style={[styles.fallbackSubtitle, { color: colors.textMuted }]}>
              {chapter.title || `Chapter ${chapter.chapterIndex}`}
            </Text>
          </View>
        )}

        {/* End of Chapter Section */}
        <View style={[styles.endOfChapterCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.endOfChapterTitle, { color: colors.text }]}>
            End of Chapter {chapter.chapterIndex}
          </Text>
          <Text style={[styles.endOfChapterSubtitle, { color: colors.textMuted }]}>
            You have reached the end of this episode.
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
    paddingBottom: 80,
  },
  canvasTouchable: {
    width: '100%',
  },
  pageWrapper: {
    width: SCREEN_WIDTH,
    backgroundColor: '#0a0a10',
  },
  pageImage: {
    width: SCREEN_WIDTH,
  },
  fallbackCanvas: {
    width: SCREEN_WIDTH,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fallbackSubtitle: {
    fontSize: 14,
  },
  endOfChapterCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
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
