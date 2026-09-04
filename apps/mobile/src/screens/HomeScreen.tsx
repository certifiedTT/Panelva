import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import {
  Search,
  Sparkles,
  TrendingUp,
  BookOpen,
  History,
  Star,
  Compass,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card, Button, Badge, SeriesCard, Skeleton, EmptyState } from '@panelva/ui';

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
    coverUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    quote: 'In a dystopian metropolis ruled by digital syndicates, an exiled blade returns...',
  },
  {
    id: 'c2',
    title: 'Born to be Grand Duchess',
    rating: '9.8',
    genre: 'Romance',
    type: 'NOVEL',
    coverBg: '#0f172a',
    coverUrl:
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
    quote: 'Reborn to rewrite royal splits and claim her rightful throne.',
  },
  {
    id: 'c3',
    title: 'Archmage Curriculum',
    rating: '9.7',
    genre: 'Fantasy',
    type: 'COMIC',
    coverBg: '#1e293b',
    coverUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
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
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'COMIC' | 'NOVEL'>('ALL');

  const filteredTrending = trendingSeries.filter((s) => {
    if (formatFilter === 'ALL') return true;
    return s.type === formatFilter;
  });

  const carouselItemWidth = SCREEN_WIDTH - spacing.xl;
  const carouselSnapInterval = carouselItemWidth + spacing.md;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top App Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoIconBg}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
          <Text style={styles.brandTitle}>Panelva</Text>
        </View>

        {/* Global Search Button */}
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={onOpenSearch}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Search comics and novels"
        >
          <Search size={18} color={colors.textMuted} />
          <Text style={styles.searchText}>Search titles, authors, genres...</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Carousel */}
      <View style={styles.carouselSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={carouselSnapInterval}
          decelerationRate="fast"
          snapToAlignment="center"
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / carouselSnapInterval);
            setActiveCarouselIndex(Math.max(0, Math.min(index, CAROUSEL_ITEMS.length - 1)));
          }}
          contentContainerStyle={styles.carouselScrollContent}
        >
          {CAROUSEL_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.carouselCard, { width: carouselItemWidth }]}
              onPress={() => onSelectSeries(item)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={`Featured: ${item.title}`}
            >
              {item.coverUrl ? (
                <ExpoImage source={{ uri: item.coverUrl }} style={styles.carouselImg} contentFit="cover" />
              ) : (
                <View style={[styles.carouselImgPlaceholder, { backgroundColor: colors.surface }]} />
              )}
              <View style={styles.carouselOverlay}>
                <Badge variant="primary" size="sm">
                  {item.type}
                </Badge>
                <Text style={styles.carouselTitle}>{item.title}</Text>
                <Text style={styles.carouselQuote} numberOfLines={2}>
                  {item.quote}
                </Text>
                <View style={styles.carouselMeta}>
                  <View style={styles.ratingRow}>
                    <Star size={12} color={colors.warning} fill={colors.warning} />
                    <Text style={styles.carouselRating}>{item.rating}</Text>
                  </View>
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
                i === activeCarouselIndex && { width: spacing.md },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Continue Reading Section (if available) */}
      {readingHistory && readingHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <History size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Continue Reading</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.continueScrollContent}
          >
            {readingHistory.slice(0, 6).map((item: any) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelectSeries(item.chapter?.series)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Continue reading ${item.chapter?.series?.title || 'Series'}`}
              >
                <Card style={styles.continueCard}>
                  {item.chapter?.series?.coverUrl ? (
                    <ExpoImage
                      source={{ uri: item.chapter.series.coverUrl }}
                      style={styles.continueThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.continueThumbPlaceholder}>
                      <BookOpen size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.continueContent}>
                    <Text style={styles.continueTitle} numberOfLines={1}>
                      {item.chapter?.series?.title || 'Series'}
                    </Text>
                    <Text style={styles.continueChapter}>
                      Ch. {item.chapter?.chapterIndex} • {item.progressPct}% read
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${item.progressPct}%` }]} />
                    </View>
                  </View>
                </Card>
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
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFormatFilter(fmt)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filter by ${fmt}`}
            >
              <Text
                style={[
                  styles.formatBtnText,
                  { color: isSelected ? colors.text : colors.textMuted },
                ]}
              >
                {fmt === 'ALL' ? 'All Releases' : fmt === 'COMIC' ? 'Comics & Manhwa' : 'Web Novels'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Trending Series Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleGroup}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Trending on Panelva</Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigateToSeries()}
            accessibilityRole="button"
            accessibilityLabel="Explore all trending series"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={styles.seeAllText}>Explore All</Text>
              <ChevronRight size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {filteredTrending.length > 0 ? (
          <View style={[styles.gridContainer, { gap: gridGap }]}>
            {filteredTrending.map((series) => (
              <SeriesCard
                key={series.id}
                title={series.title}
                rating={series.rating || '9.8'}
                genre={series.genre || 'General'}
                type={series.type === 'NOVEL' ? 'NOVEL' : 'COMIC'}
                coverUrl={series.coverUrl}
                totalChapters={series.chapters ? parseInt(series.chapters) : undefined}
                onPress={() => onSelectSeries(series)}
                cardWidth={cardWidth}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<Compass size={32} color={colors.primary} />}
            title="No Series in this Category"
            description="No stories match this filter right now. Explore all releases to see our complete library."
            actionLabel="Show All Releases"
            onAction={() => setFormatFilter('ALL')}
          />
        )}
      </View>

      {/* Creator Spotlight / Community Discovery Card */}
      <View style={styles.spotlightWrapper}>
        <Card style={styles.creatorSpotlightCard}>
          <View style={styles.spotlightIconCircle}>
            <Sparkles size={24} color={colors.primary} />
          </View>
          <View style={styles.spotlightContent}>
            <Text style={styles.spotlightTitle}>Join the Creator Community</Text>
            <Text style={styles.spotlightDesc}>
              Discover creator posts, behind the scenes art, interactive polls, or apply to publish your own webcomics and novels.
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <Button
                title="Open Creator Hub"
                variant="primary"
                onPress={onNavigateToCreatorHub}
              />
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: colors.text,
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
  },
  brandTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  searchText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    flex: 1,
  },
  carouselSection: {
    marginTop: spacing.md,
  },
  carouselScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  carouselCard: {
    height: 192,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
    position: 'relative',
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
    padding: spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    gap: spacing.xs,
  },
  carouselTitle: {
    color: colors.text,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  carouselQuote: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  carouselMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  carouselRating: {
    color: colors.warning,
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  carouselGenre: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.full,
  },
  formatFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBtnText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.primary,
  },
  continueScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  continueCard: {
    width: 224,
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  continueThumb: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
  },
  continueThumbPlaceholder: {
    width: 48,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueContent: {
    flex: 1,
    gap: spacing.xs,
  },
  continueTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  continueChapter: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
  progressBarBg: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    textAlign: 'center',
    color: colors.textMuted,
  },
  spotlightWrapper: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  creatorSpotlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.border,
  },
  spotlightIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightContent: {
    flex: 1,
    gap: spacing.xs,
  },
  spotlightTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text,
  },
  spotlightDesc: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textMuted,
  },
});
