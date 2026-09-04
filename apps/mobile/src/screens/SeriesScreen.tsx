import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { trpc } from '../../lib/trpc';
import { ContentCard } from '../components/common/ContentCard';
import {
  Search,
  X,
  BookOpen,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@panelva/theme';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MOCK_PLATFORM_SERIES } from '../data/mockData';
import { getLocalFeedCache, setLocalFeedCache, CACHE_KEYS } from '../hooks/useFeedPrefetch';

interface SeriesScreenProps {
  onSelectSeries: (series: any) => void;
  initialGenre?: string;
  cardWidth: number;
  gridGap: number;
}

const GENRES = [
  'All',
  'Fantasy',
  'Action',
  'Romance',
  'Shoujo',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Mystery',
  'Horror',
];

const SORT_OPTIONS = ['Popularity', 'Likes', 'Newest', 'Alphabetical'] as const;

function GridSkeleton({ cardWidth, gridGap }: { cardWidth: number; gridGap: number }) {
  return (
    <View style={[styles.gridContainer, { gap: gridGap }]}>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <View key={key} style={{ width: cardWidth, gap: spacing.xs }}>
          <View
            style={{
              width: cardWidth,
              height: cardWidth * 1.4,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            }}
          />
          <View
            style={{
              width: '70%',
              height: 16,
              borderRadius: radius.sm,
              backgroundColor: colors.surface,
            }}
          />
          <View
            style={{
              width: '40%',
              height: 12,
              borderRadius: radius.sm,
              backgroundColor: colors.surface,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export function SeriesScreen({
  onSelectSeries,
  initialGenre = 'All',
  cardWidth,
  gridGap,
}: SeriesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMIC' | 'NOVEL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'Popularity' | 'Likes' | 'Newest' | 'Alphabetical'>('Popularity');
  const [cachedSeries, setCachedSeries] = useState<any[]>([]);

  // Instant local cache loader (0ms render)
  useEffect(() => {
    let isMounted = true;
    async function loadCache() {
      const cached = await getLocalFeedCache<any[]>(CACHE_KEYS.SERIES_ALL);
      if (isMounted && cached && cached.length > 0) {
        setCachedSeries(cached);
      }
    }
    loadCache();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live series query from backend
  const { data: dbSeriesList, isLoading } = (trpc.series.getMany as any).useQuery({
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    genre: selectedGenre === 'All' ? undefined : selectedGenre,
    status: statusFilter === 'ALL' ? undefined : (statusFilter as any),
    sortBy,
    searchQuery: searchQuery.trim() || undefined,
    limit: 40,
  });

  // Sync fresh series to cache
  useEffect(() => {
    if (
      dbSeriesList &&
      dbSeriesList.length > 0 &&
      !searchQuery.trim() &&
      typeFilter === 'ALL' &&
      selectedGenre === 'All'
    ) {
      setLocalFeedCache(CACHE_KEYS.SERIES_ALL, dbSeriesList);
    }
  }, [dbSeriesList, searchQuery, typeFilter, selectedGenre]);

  // Global search fallback query if search query is active
  const { data: searchResults } = (trpc.series.search as any).useQuery(
    { query: searchQuery.trim(), limit: 30 },
    { enabled: searchQuery.trim().length > 1 }
  );

  const fallbackFiltered = (cachedSeries.length > 0 ? cachedSeries : MOCK_PLATFORM_SERIES).filter(
    (s) => {
      if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
      if (selectedGenre !== 'All' && s.genre !== selectedGenre) return false;
      if (
        searchQuery.trim() &&
        !s.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
        return false;
      return true;
    }
  );

  const displayList =
    searchQuery.trim().length > 1 && searchResults && searchResults.length > 0
      ? searchResults
      : dbSeriesList && dbSeriesList.length > 0
      ? dbSeriesList
      : fallbackFiltered;

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Discover Series</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search series by title or author..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Clear search input"
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Format Selector Pills (All / Comics / Novels) */}
        <View style={styles.formatRow}>
          {(['ALL', 'COMIC', 'NOVEL'] as const).map((fmt) => {
            const isSelected = typeFilter === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                style={[
                  styles.formatPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTypeFilter(fmt)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filter by ${fmt}`}
              >
                <Text
                  style={[
                    styles.formatPillText,
                    { color: isSelected ? colors.text : colors.textMuted },
                  ]}
                >
                  {fmt === 'ALL' ? 'All Types' : fmt === 'COMIC' ? 'Comics' : 'Novels'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Horizontal Genre Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScroll}
        >
          {GENRES.map((g) => {
            const isSelected = selectedGenre === g;
            return (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genrePill,
                  {
                    backgroundColor: isSelected ? colors.card : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedGenre(g)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Select genre ${g}`}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    {
                      color: isSelected ? colors.primary : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Grid View */}
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Results Bar & Horizontal Sort Control */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>{displayList.length} Series Available</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs }}
          >
            {SORT_OPTIONS.map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortBtn,
                  {
                    backgroundColor: sortBy === sort ? colors.card : colors.surface,
                    borderColor: sortBy === sort ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy(sort)}
                accessibilityRole="tab"
                accessibilityState={{ selected: sortBy === sort }}
                accessibilityLabel={`Sort by ${sort}`}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    {
                      color: sortBy === sort ? colors.primary : colors.textMuted,
                      fontWeight: sortBy === sort ? '700' : '500',
                    },
                  ]}
                >
                  {sort}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {displayList.length > 0 ? (
          <View style={[styles.gridContainer, { gap: gridGap }]}>
            {displayList.map((series: any) => (
              <ContentCard
                key={series.id}
                title={series.title}
                rating={series.rating || '9.8'}
                genre={series.genre || 'General'}
                type={series.type === 'NOVEL' ? 'Novel' : 'Manhwa'}
                coverBg={series.coverBg || colors.surface}
                coverUrl={series.coverUrl}
                views={series.views ? `${(series.views / 1000).toFixed(0)}k` : '1.2k'}
                chapters={series.chapters ? `${series.chapters.length} Chapters` : 'Ongoing'}
                isHot={series.likes > 50}
                onPress={() => onSelectSeries(series)}
                width={cardWidth}
              />
            ))}
          </View>
        ) : isLoading ? (
          <GridSkeleton cardWidth={cardWidth} gridGap={gridGap} />
        ) : (
          <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.lg }}>
            <Card style={styles.emptyCard}>
              <BookOpen size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Series Match Your Search</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your genre filter, keyword search, or category format.
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                <Button
                  title="Reset Filters"
                  variant="primary"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedGenre('All');
                    setTypeFilter('ALL');
                  }}
                />
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  pageTitle: {
    fontSize: typography.h2.fontSize,
    lineHeight: typography.h2.lineHeight,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.caption.fontSize,
    height: '100%',
    color: colors.text,
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatPillText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
  },
  genreScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  genrePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: typography.caption.fontSize,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  resultsCount: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.textMuted,
  },
  sortBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: typography.caption.fontSize,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.h3.fontSize,
    lineHeight: typography.h3.lineHeight,
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
});
