import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../theme/ThemeContext';
import { ContentCard } from '../components/common/ContentCard';
import { SearchIcon, SparklesIcon, TrendingUpIcon, BookOpenIcon, HistoryIcon } from '../components/common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeScreenProps {
  trendingSeries: any[];
  readingHistory?: any[];
  onSelectSeries: (series: any) => void;
  onOpenSearch: () => void;
  onNavigateToSeries: (genre?: string) => void;
  onNavigateToCreatorHub: () => void;
  cardWidth: number;
  gridGap: number;
}

const CAROUSEL_ITEMS = [
  {
    id: 'c1',
    title: 'Shadow City: Neon Blade',
    rating: '9.9',
    genre: 'Action',
    type: 'COMIC',
    coverBg: '#1e3a8a',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    quote: 'In a dystopian metropolis ruled by digital syndicates, an exiled blade returns...',
  },
  {
    id: 'c2',
    title: 'Born to be Grand Duchess',
    rating: '9.8',
    genre: 'Romance',
    type: 'NOVEL',
    coverBg: '#0f172a',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
    quote: 'Reborn to rewrite royal splits and claim her rightful throne.',
  },
  {
    id: 'c3',
    title: 'Archmage Curriculum',
    rating: '9.7',
    genre: 'Fantasy',
    type: 'COMIC',
    coverBg: '#1e293b',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    quote: 'School of elemental arrays is now open. Master the ancient runes.',
  },
];

export function HomeScreen({
  trendingSeries,
  readingHistory,
  onSelectSeries,
  onOpenSearch,
  onNavigateToSeries,
  onNavigateToCreatorHub,
  cardWidth,
  gridGap,
}: HomeScreenProps) {
  const { colors } = useTheme();
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'COMIC' | 'NOVEL'>('ALL');

  const filteredTrending = trendingSeries.filter((s) => {
    if (formatFilter === 'ALL') return true;
    return s.type === formatFilter;
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Top App Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.brandRow}>
          <View style={[styles.logoIconBg, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Panelva</Text>
        </View>

        {/* Global Search Button */}
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={onOpenSearch}
          activeOpacity={0.7}
          accessibilityLabel="Search comics and novels"
        >
          <SearchIcon size={18} color={colors.textMuted} />
          <Text style={[styles.searchText, { color: colors.textMuted }]}>Search titles, authors, genres...</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Carousel */}
      <View style={styles.carouselSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
            setActiveCarouselIndex(index);
          }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {CAROUSEL_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.carouselCard, { width: SCREEN_WIDTH - 32, backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => onSelectSeries(item)}
              activeOpacity={0.9}
            >
              {item.coverUrl ? (
                <ExpoImage source={{ uri: item.coverUrl }} style={styles.carouselImg} contentFit="cover" />
              ) : (
                <View style={[styles.carouselImgPlaceholder, { backgroundColor: item.coverBg }]} />
              )}
              <View style={styles.carouselOverlay}>
                <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.typeBadgeText}>{item.type}</Text>
                </View>
                <Text style={styles.carouselTitle}>{item.title}</Text>
                <Text style={styles.carouselQuote} numberOfLines={2}>{item.quote}</Text>
                <View style={styles.carouselMeta}>
                  <Text style={styles.carouselRating}>★ {item.rating}</Text>
                  <Text style={styles.carouselGenre}>• {item.genre}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Carousel Pagination Dots */}
        <View style={styles.dotsRow}>
          {CAROUSEL_ITEMS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeCarouselIndex ? colors.primary : colors.border },
                i === activeCarouselIndex && { width: 18 },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Continue Reading Section (if available) */}
      {readingHistory && readingHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <HistoryIcon size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Reading</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {readingHistory.slice(0, 6).map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.continueCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={() => onSelectSeries(item.chapter?.series)}
                activeOpacity={0.8}
              >
                {item.chapter?.series?.coverUrl ? (
                  <ExpoImage source={{ uri: item.chapter.series.coverUrl }} style={styles.continueThumb} />
                ) : (
                  <View style={[styles.continueThumbPlaceholder, { backgroundColor: colors.primaryMuted }]}>
                    <BookOpenIcon size={20} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
                    {item.chapter?.series?.title || 'Series'}
                  </Text>
                  <Text style={[styles.continueChapter, { color: colors.textMuted }]}>
                    Ch. {item.chapter?.chapterIndex} • {item.progressPct}% read
                  </Text>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.borderSubtle }]}>
                    <View style={[styles.progressBarFill, { width: `${item.progressPct}%`, backgroundColor: colors.primary }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Format Filter Bar (All / Comics / Novels) */}
      <View style={styles.formatFilterRow}>
        {(['ALL', 'COMIC', 'NOVEL'] as const).map((fmt) => {
          const isSelected = formatFilter === fmt;
          return (
            <TouchableOpacity
              key={fmt}
              style={[
                styles.formatBtn,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                  borderColor: isSelected ? colors.primaryDark : colors.border,
                },
              ]}
              onPress={() => setFormatFilter(fmt)}
            >
              <Text style={[styles.formatBtnText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                {fmt === 'ALL' ? 'All Releases' : fmt === 'COMIC' ? 'Comics & Manhwa' : 'Web Novels'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Trending Series Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUpIcon size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending on Panelva</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateToSeries()}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Explore All &rsaquo;</Text>
          </TouchableOpacity>
        </View>

        {filteredTrending.length > 0 ? (
          <View style={[styles.gridContainer, { gap: gridGap }]}>
            {filteredTrending.map((series) => (
              <ContentCard
                key={series.id}
                title={series.title}
                rating={series.rating || '9.8'}
                genre={series.genre || 'General'}
                type={series.type === 'NOVEL' ? 'Novel' : 'Manhwa'}
                coverBg={series.coverBg || '#1e3a8a'}
                coverUrl={series.coverUrl}
                views={series.views}
                chapters={series.chapters}
                isHot={series.isHot}
                onPress={() => onSelectSeries(series)}
                width={cardWidth}
              />
            ))}
          </View>
        ) : (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted }}>No series found in this category.</Text>
          </View>
        )}
      </View>

      {/* Creator Spotlight / Community Discovery Card */}
      <View style={{ paddingHorizontal: 16, marginBottom: 30 }}>
        <View style={[styles.creatorSpotlightCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primaryMuted }]}>
          <View style={[styles.spotlightIconCircle, { backgroundColor: colors.primaryMuted }]}>
            <SparklesIcon size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.spotlightTitle, { color: colors.text }]}>Join the Creator Community</Text>
            <Text style={[styles.spotlightDesc, { color: colors.textMuted }]}>
              Discover creator posts, behind the scenes art, interactive polls, or apply to publish your own webcomics and novels.
            </Text>
            <TouchableOpacity
              style={[styles.spotlightBtn, { backgroundColor: colors.primary }]}
              onPress={onNavigateToCreatorHub}
              activeOpacity={0.8}
            >
              <Text style={styles.spotlightBtnText}>Open Creator Hub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchText: {
    fontSize: 13,
    flex: 1,
  },
  carouselSection: {
    marginTop: 14,
  },
  carouselCard: {
    height: 190,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  carouselImg: {
    width: '100%',
    height: '100%',
  },
  carouselImgPlaceholder: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(5, 5, 12, 0.85)',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  carouselTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  carouselQuote: {
    color: '#D1D5DB',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  carouselMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  carouselRating: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  carouselGenre: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  formatFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  continueCard: {
    width: 220,
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  continueThumb: {
    width: 44,
    height: 60,
    borderRadius: 6,
  },
  continueThumbPlaceholder: {
    width: 44,
    height: 60,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  continueChapter: {
    fontSize: 11,
    marginTop: 2,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  creatorSpotlightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 14,
    alignItems: 'center',
  },
  spotlightIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  spotlightDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  spotlightBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  spotlightBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
