import { getSupabaseClient } from '../client';
import { SeriesRow, ChapterRow } from '../types';

export const seriesQueryKeys = {
  all: ['series'] as const,
  list: (filters?: { type?: string; genre?: string }) => [...seriesQueryKeys.all, 'list', filters] as const,
  detail: (seriesId: string) => [...seriesQueryKeys.all, 'detail', seriesId] as const,
  chapters: (seriesId: string) => [...seriesQueryKeys.all, 'chapters', seriesId] as const,
};

export interface SeriesListFilters {
  type?: 'COMIC' | 'NOVEL';
  genre?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetches browsable series with optional filters (comic vs novel, genre, pagination).
 */
export async function fetchSeriesList(filters?: SeriesListFilters): Promise<SeriesRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('series').select('*');

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.genre && filters.genre !== 'All') {
    query = query.eq('genre', filters.genre);
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch series list: ${error.message}`);
  }

  return (data as SeriesRow[]) || [];
}

/**
 * Fetches a single series with creator profile details.
 */
export async function fetchSeriesDetails(seriesId: string): Promise<SeriesRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .eq('id', seriesId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch series details: ${error.message}`);
  }

  return (data as SeriesRow) || null;
}

/**
 * Fetches all chapters/episodes for a series.
 */
export async function fetchChaptersForSeries(seriesId: string): Promise<ChapterRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('series_id', seriesId)
    .order('chapter_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chapters: ${error.message}`);
  }

  return (data as ChapterRow[]) || [];
}
