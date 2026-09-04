import { getSupabaseClient } from '../client';
import {
  Studio,
  StudioMember,
  ChapterTask,
  ChapterVersion,
  SeriesRevenueSplit,
  Contract,
  StudioDailyStats,
} from '@panelva/database';

export const studioQueryKeys = {
  all: ['studio'] as const,
  detail: (studioId: string) => [...studioQueryKeys.all, 'detail', studioId] as const,
  members: (studioId: string) => [...studioQueryKeys.all, 'members', studioId] as const,
  tasks: (seriesId: string, status?: string) => [...studioQueryKeys.all, 'tasks', seriesId, status] as const,
  versions: (chapterId: string) => [...studioQueryKeys.all, 'versions', chapterId] as const,
  splits: (seriesId: string) => [...studioQueryKeys.all, 'splits', seriesId] as const,
  contracts: (studioId: string) => [...studioQueryKeys.all, 'contracts', studioId] as const,
  analytics: (studioId: string) => [...studioQueryKeys.all, 'analytics', studioId] as const,
};

/**
 * Fetches organization details for a studio.
 */
export async function fetchStudioDetails(studioId: string): Promise<Studio | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('studios')
    .select('*')
    .eq('id', studioId)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as Studio;
}

/**
 * Fetches all team members and assigned roles for a studio.
 */
export async function fetchStudioMembers(studioId: string): Promise<StudioMember[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('studio_members')
    .select('*')
    .eq('studio_id', studioId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch studio members: ${error.message}`);
  }

  return (data as unknown as StudioMember[]) || [];
}

/**
 * Fetches Kanban tasks for a series production board.
 */
export async function fetchChapterTasks(seriesId: string, status?: string): Promise<ChapterTask[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('chapter_tasks').select('*').eq('series_id', seriesId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch chapter tasks: ${error.message}`);
  }

  return (data as unknown as ChapterTask[]) || [];
}

/**
 * Fetches non-destructive artwork and script revision history for a chapter.
 */
export async function fetchChapterVersions(chapterId: string): Promise<ChapterVersion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('chapter_versions')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch chapter versions: ${error.message}`);
  }

  return (data as unknown as ChapterVersion[]) || [];
}

/**
 * Fetches active revenue split rules for a collaborative series.
 */
export async function fetchSeriesRevenueSplits(seriesId: string): Promise<SeriesRevenueSplit[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('series_revenue_splits')
    .select('*')
    .eq('series_id', seriesId)
    .order('percentage', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch revenue splits: ${error.message}`);
  }

  return (data as unknown as SeriesRevenueSplit[]) || [];
}

/**
 * Fetches contracts created within a studio.
 */
export async function fetchStudioContracts(studioId: string): Promise<Contract[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('studio_id', studioId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch studio contracts: ${error.message}`);
  }

  return (data as unknown as Contract[]) || [];
}

/**
 * Fetches daily performance metrics for studio leadership dashboard.
 */
export async function fetchStudioAnalytics(studioId: string, limit = 30): Promise<StudioDailyStats[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('studio_daily_stats')
    .select('*')
    .eq('studio_id', studioId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch studio stats: ${error.message}`);
  }

  return (data as unknown as StudioDailyStats[]) || [];
}
