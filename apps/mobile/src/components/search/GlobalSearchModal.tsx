import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { trpc } from '../../../lib/trpc';
import {
  SearchIcon,
  CloseIcon,
  SparklesIcon,
  BookOpenIcon,
  StarIcon,
  UsersIcon,
  CheckIcon,
} from '../common/Icons';
import { MOCK_PLATFORM_SERIES, MOCK_CREATORS } from '../../data/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRENDING_SEARCH_TAGS = [
  'Shadow City',
  'Grand Duchess',
  'Studio Spectre',
  'Cyberpunk',
  'Reincarnation',
  'Fantasy Magic',
  'Solo Leveling',
  'Lady Seraphina',
];

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSeries: (series: any) => void;
  onSelectCreator: (creatorProfileId: string) => void;
}

export function GlobalSearchModal({
  visible,
  onClose,
  onSelectSeries,
  onSelectCreator,
}: GlobalSearchModalProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'COMIC' | 'NOVEL' | 'CREATOR'>('ALL');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Shadow City',
    'Romance Novels',
  ]);

  // Query live series from backend
  const { data: dbSeriesList, isLoading: isSearchLoading } = (trpc.series.getTrending as any).useQuery(
    { limit: 20 },
    { enabled: visible }
  );

  const seriesPool = dbSeriesList && dbSeriesList.length > 0 ? dbSeriesList : MOCK_PLATFORM_SERIES;

  // Filter series and creators
  const { matchedSeries, matchedCreators } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedSeries: [], matchedCreators: [] };
    }

    const series = seriesPool.filter((s: any) => {
      const matchTitle = s.title?.toLowerCase().includes(q);
      const matchGenre = s.genre?.toLowerCase().includes(q);
      const matchAuthor = (s.creator?.penName || s.author)?.toLowerCase().includes(q);
      const matchTags = Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(q));
      const matchType =
        filterType === 'ALL'
          ? true
          : filterType === 'CREATOR'
          ? false
          : s.type === filterType;

      return (matchTitle || matchGenre || matchAuthor || matchTags) && matchType;
    });

    const creators =
      filterType === 'ALL' || filterType === 'CREATOR'
        ? MOCK_CREATORS.filter((c) => {
            return (
              c.penName.toLowerCase().includes(q) ||
              c.bio.toLowerCase().includes(q) ||
              c.type.toLowerCase().includes(q)
            );
          })
        : [];

    return { matchedSeries: series, matchedCreators: creators };
  }, [searchQuery, filterType, seriesPool]);

  const totalResultsCount = matchedSeries.length + matchedCreators.length;
  const isQueryActive = searchQuery.trim().length > 0;

  const handleSelectQueryTag = (tag: string) => {
    setSearchQuery(tag);
    if (!recentSearches.includes(tag)) {
      setRecentSearches((prev) => [tag, ...prev.slice(0, 4)]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSelectSeriesItem = (seriesItem: any) => {
    if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
      setRecentSearches((prev) => [searchQuery.trim(), ...prev.slice(0, 4)]);
    }
    onClose();
    onSelectSeries(seriesItem);
  };

  const handleSelectCreatorItem = (creatorId: string) => {
    if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
      setRecentSearches((prev) => [searchQuery.trim(), ...prev.slice(0, 4)]);
    }
    onClose();
    onSelectCreator(creatorId);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Search Header Bar */}
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
          <View style={[styles.searchBarWrapper, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <SearchIcon size={18} color={colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search comics, novels, creators, tags..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                <CloseIcon size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Type Pills */}
        <View style={[styles.filterBar, { borderBottomColor: colors.borderSubtle }]}>
          {(['ALL', 'COMIC', 'NOVEL', 'CREATOR'] as const).map((type) => {
            const isSelected = filterType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                    borderColor: isSelected ? colors.primaryDark : colors.border,
                  },
                ]}
                onPress={() => setFilterType(type)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                  {type === 'ALL'
                    ? 'All Results'
                    : type === 'COMIC'
                    ? 'Comics / Manhwa'
                    : type === 'NOVEL'
                    ? 'Light Novels'
                    : 'Creators & Authors'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!isQueryActive ? (
            /* EMPTY / SUGGESTIONS STATE */
            <View style={{ gap: 24 }}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Recent Searches</Text>
                    <TouchableOpacity onPress={() => setRecentSearches([])}>
                      <Text style={[styles.clearAllText, { color: colors.textMuted }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tagsWrapper}>
                    {recentSearches.map((tag, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        onPress={() => handleSelectQueryTag(tag)}
                      >
                        <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending Suggestions */}
              <View>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <SparklesIcon size={16} color={colors.primary} />
                    <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Trending on Panelva</Text>
                  </View>
                </View>
                <View style={styles.tagsWrapper}>
                  {TRENDING_SEARCH_TAGS.map((tag, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                      onPress={() => handleSelectQueryTag(tag)}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Popular Series Preview */}
              <View>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 10 }]}>
                  Popular Series
                </Text>
                <View style={{ gap: 10 }}>
                  {seriesPool.slice(0, 3).map((s: any) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.resultCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                      onPress={() => handleSelectSeriesItem(s)}
                      activeOpacity={0.75}
                    >
                      <ExpoImage source={{ uri: s.coverUrl }} style={styles.resultThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                          {s.title}
                        </Text>
                        <Text style={[styles.resultAuthor, { color: colors.textMuted }]}>
                          by {s.creator?.penName || s.author || 'Creator'} • {s.genre}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View style={[styles.typeBadge, { backgroundColor: colors.primaryMuted }]}>
                            <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{s.type}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <StarIcon size={12} color={colors.accentGold} />
                            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{s.rating || '9.8'}</Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : totalResultsCount > 0 ? (
            /* POPULATED SEARCH RESULTS */
            <View style={{ gap: 16 }}>
              {/* Creators Results */}
              {matchedCreators.length > 0 && (
                <View>
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 10 }]}>
                    Creators & Authors ({matchedCreators.length})
                  </Text>
                  <View style={{ gap: 8 }}>
                    {matchedCreators.map((creator) => (
                      <TouchableOpacity
                        key={creator.id}
                        style={[styles.creatorResultCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        onPress={() => handleSelectCreatorItem(creator.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.creatorAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.creatorAvatarLetter}>
                            {creator.penName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.creatorName, { color: colors.text }]}>{creator.penName}</Text>
                            {creator.isVetted && (
                              <View style={[styles.verifiedTag, { backgroundColor: colors.primaryMuted }]}>
                                <Text style={[styles.verifiedTagText, { color: colors.primary }]}>Verified</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.creatorBio, { color: colors.textMuted }]} numberOfLines={1}>
                            {creator.bio}
                          </Text>
                          <Text style={[styles.creatorStats, { color: colors.textSecondary }]}>
                            {creator.followerCount.toLocaleString()} followers • {creator.type}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Series Results */}
              {matchedSeries.length > 0 && (
                <View>
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginBottom: 10 }]}>
                    Series & Titles ({matchedSeries.length})
                  </Text>
                  <View style={{ gap: 10 }}>
                    {matchedSeries.map((s: any) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.resultCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        onPress={() => handleSelectSeriesItem(s)}
                        activeOpacity={0.75}
                      >
                        <ExpoImage source={{ uri: s.coverUrl }} style={styles.resultThumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                            {s.title}
                          </Text>
                          <Text style={[styles.resultAuthor, { color: colors.textMuted }]} numberOfLines={1}>
                            by {s.creator?.penName || s.author || 'Creator'} • {s.genre}
                          </Text>
                          <Text style={[styles.resultDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                            {s.description}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <View style={[styles.typeBadge, { backgroundColor: colors.primaryMuted }]}>
                              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{s.type}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <StarIcon size={12} color={colors.accentGold} />
                              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{s.rating || '9.8'}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* NO RESULTS STATE */
            <View style={styles.noResultsBox}>
              <SearchIcon size={44} color={colors.textMuted} />
              <Text style={[styles.noResultsTitle, { color: colors.text }]}>
                No results found for "{searchQuery}"
              </Text>
              <Text style={[styles.noResultsSub, { color: colors.textMuted }]}>
                Try searching for a different keyword, genre, or check for typos.
              </Text>
              <View style={[styles.suggestionBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.suggestionHeading, { color: colors.textSecondary }]}>Try searching for:</Text>
                <View style={styles.tagsWrapper}>
                  {['Action', 'Romance', 'Fantasy', 'Shadow City'].map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => setSearchQuery(tag)}
                    >
                      <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  resultThumb: {
    width: 68,
    height: 90,
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  resultAuthor: {
    fontSize: 12,
    marginTop: 2,
  },
  resultDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  creatorResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  creatorBio: {
    fontSize: 12,
    marginTop: 2,
  },
  creatorStats: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  noResultsBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  noResultsSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  suggestionBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 10,
  },
  suggestionHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
});
