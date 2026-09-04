import { getSupabaseClient } from '../client';
import { SeriesRow } from '../types';

export const homeQueryKeys = {
  all: ['home'] as const,
  featured: () => [...homeQueryKeys.all, 'featured'] as const,
  trending: (type?: string) => [...homeQueryKeys.all, 'trending', type] as const,
};

/**
 * Fetches top rated / highlighted series for the Home banner & carousel.
 */
export async function fetchHomeFeaturedSeries(limit = 5): Promise<SeriesRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('status', 'ONGOING')
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured series: ${error.message}`);
  }

  return (data as SeriesRow[]) || [];
}

/**
 * Fetches trending serialized titles by view count.
 */
export async function fetchTrendingSeries(type?: 'COMIC' | 'NOVEL', limit = 10): Promise<SeriesRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('series')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch trending series: ${error.message}`);
  }

  return (data as SeriesRow[]) || [];
}
