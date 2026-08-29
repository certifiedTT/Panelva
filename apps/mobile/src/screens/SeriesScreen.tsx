import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { trpc } from '../../lib/trpc';
import { ContentCard } from '../components/common/ContentCard';
import {
  SearchIcon,
  FilterIcon,
  CloseIcon,
  ComicsIcon,
  NovelsIcon,
  BookOpenIcon,
} from '../components/common/Icons';

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

export function SeriesScreen({
  onSelectSeries,
  initialGenre = 'All',
  cardWidth,
  gridGap,
}: SeriesScreenProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMIC' | 'NOVEL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'Popularity' | 'Likes' | 'Newest' | 'Alphabetical'>('Popularity');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
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
    if (dbSeriesList && dbSeriesList.length > 0 && !searchQuery.trim() && typeFilter === 'ALL' && selectedGenre === 'All') {
      setLocalFeedCache(CACHE_KEYS.SERIES_ALL, dbSeriesList);
    }
  }, [dbSeriesList, searchQuery, typeFilter, selectedGenre]);

  // Global search fallback query if search query is active
  const { data: searchResults } = (trpc.series.search as any).useQuery(
    { query: searchQuery.trim(), limit: 30 },
    { enabled: searchQuery.trim().length > 1 }
  );

  const fallbackFiltered = (cachedSeries.length > 0 ? cachedSeries : MOCK_PLATFORM_SERIES).filter((s) => {
    if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
    if (selectedGenre !== 'All' && s.genre !== selectedGenre) return false;
    if (searchQuery.trim() && !s.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  const displayList = (searchQuery.trim().length > 1 && searchResults && searchResults.length > 0)
    ? searchResults
    : (dbSeriesList && dbSeriesList.length > 0)
    ? dbSeriesList
    : fallbackFiltered;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with Search */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Discover Series</Text>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search series by title or author..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                <CloseIcon size={16} color={colors.textMuted} />
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
                    backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primaryDark : colors.border,
                  },
                ]}
                onPress={() => setTypeFilter(fmt)}
              >
                <Text style={[styles.formatPillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
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
                    backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedGenre(g)}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    { color: isSelected ? colors.primary : colors.textMuted, fontWeight: isSelected ? '700' : '500' },
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
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Results Bar & Sort Control */}
        <View style={styles.resultsBar}>
          <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
            {displayList.length} Series Available
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {SORT_OPTIONS.map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortBtn,
                  {
                    backgroundColor: sortBy === sort ? colors.primaryMuted : 'transparent',
                    borderColor: sortBy === sort ? colors.primary : 'transparent',
                  },
                ]}
                onPress={() => setSortBy(sort)}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    { color: sortBy === sort ? colors.primary : colors.textMuted, fontWeight: sortBy === sort ? '700' : '500' },
                  ]}
                >
                  {sort}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
                coverBg={series.coverBg || (series.type === 'NOVEL' ? '#0f172a' : '#1e3a8a')}
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
          <View style={{ padding: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <BookOpenIcon size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No series match your search</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Try adjusting your genre filter, keyword search, or category format.
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setTypeFilter('ALL');
              }}
            >
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  genreScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  genrePillText: {
    fontSize: 11,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: 11,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
