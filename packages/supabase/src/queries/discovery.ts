import { getSupabaseClient } from '../client';
import {
  Series,
  ReadHistory,
  LibraryEntry,
  UserStreak,
  Achievement,
  UserAchievement,
  UnifiedSearchResult,
  deduplicateHomeSections,
  HomeFeedSections,
} from '@panelva/database';

export const discoveryQueryKeys = {
  all: ['discovery'] as const,
  personalizedHome: (userId?: string) => [...discoveryQueryKeys.all, 'personalizedHome', userId] as const,
  trending: () => [...discoveryQueryKeys.all, 'trending'] as const,
  continueReading: (userId: string) => [...discoveryQueryKeys.all, 'continueReading', userId] as const,
  library: (userId: string, status?: string) => [...discoveryQueryKeys.all, 'library', userId, status] as const,
  streak: (userId: string) => [...discoveryQueryKeys.all, 'streak', userId] as const,
  achievements: () => [...discoveryQueryKeys.all, 'achievements'] as const,
  userAchievements: (userId: string) => [...discoveryQueryKeys.all, 'userAchievements', userId] as const,
  search: (query: string, filter?: string) => [...discoveryQueryKeys.all, 'search', query, filter] as const,
};

/**
 * Fetches 24h algorithmically ranked trending series.
 */
export async function fetchTrendingRanked(limit = 20): Promise<Series[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await (supabase as any).rpc('get_algorithmic_trending', {
    p_limit: limit,
  });

  if (error || !data) {
    // Fallback query
    const fallback = await supabase
      .from('series')
      .select('*')
      .eq('status', 'ONGOING')
      .order('view_count', { ascending: false })
      .limit(limit);
    return (fallback.data as unknown as Series[]) || [];
  }

  return data as unknown as Series[];
}

/**
 * Fetches user's "Continue Reading" shelf with latest progress.
 */
export async function fetchContinueReading(userId: string, limit = 10): Promise<ReadHistory[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('read_history')
    .select('*')
    .eq('user_id', userId)
    .order('last_read', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data as unknown as ReadHistory[]) || [];
}

/**
 * Fetches user's organized reading library.
 */
export async function fetchUserLibrary(userId: string, status?: string): Promise<LibraryEntry[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('library').select('*').eq('user_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch library: ${error.message}`);
  }

  return (data as unknown as LibraryEntry[]) || [];
}

/**
 * Fetches the user's active reading streak.
 */
export async function fetchUserStreak(userId: string): Promise<UserStreak | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_read_date: null,
      updated_at: new Date().toISOString(),
    };
  }

  return data as unknown as UserStreak;
}

/**
 * Fetches all unlocked achievements for a user.
 */
export async function fetchUserAchievements(userId: string): Promise<UserAchievement[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data as unknown as UserAchievement[]) || [];
}

/**
 * Executes a Spotify-style multi-table unified search.
 */
export async function fetchUnifiedSearch(
  query: string,
  filter: 'ALL' | 'SERIES' | 'CREATORS' | 'POSTS' = 'ALL',
  limit = 20
): Promise<UnifiedSearchResult[]> {
  if (!query.trim()) return [];

  const supabase = getSupabaseClient();
  const { data, error } = await (supabase as any).rpc('search_unified', {
    p_query: query.trim(),
    p_filter: filter,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return (data as unknown as UnifiedSearchResult[]) || [];
}

/**
 * Fetches personalized Home feed with cross-section deduplication.
 * Sections: Continue Reading, Trending, Genre Recommendation, Creator Spotlight.
 */
export async function fetchPersonalizedHomeFeed(
  userId?: string,
  preferredGenre = 'Fantasy'
): Promise<HomeFeedSections<Series>> {
  const supabase = getSupabaseClient();

  // 1. Trending
  const trendingPromise = fetchTrendingRanked(10);

  // 2. Genre Recommended
  const genrePromise = supabase
    .from('series')
    .select('*')
    .contains('genre', [preferredGenre])
    .limit(10);

  // 3. Creator Spotlight (Emerging creators' series)
  const spotlightPromise = supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const [trending, genreResult, spotlightResult] = await Promise.all([
    trendingPromise,
    genrePromise,
    spotlightPromise,
  ]);

  const rawSections: HomeFeedSections<Series> = {
    continueReading: [], // Populated on screen with full series joins
    trending: trending || [],
    genreRecommended: (genreResult.data as unknown as Series[]) || [],
    creatorSpotlight: (spotlightResult.data as unknown as Series[]) || [],
  };

  // Enforce zero cross-section duplication
  return deduplicateHomeSections(rawSections);
}
