import { getSupabaseClient } from '../client';
import { LibraryStatus } from '@panelva/database';

export interface RecordReadingSessionParams {
  userId: string;
  chapterId: string;
  progress: number;
}

/**
 * Records reading progress, updates read history, and advances consecutive reading streak.
 */
export async function recordReadingSession({
  userId,
  chapterId,
  progress,
}: RecordReadingSessionParams): Promise<{ success: boolean; seriesId: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await (supabase as any).rpc('record_read_session', {
    p_user_id: userId,
    p_chapter_id: chapterId,
    p_progress: progress,
  });

  if (error) {
    throw new Error(`Failed to record reading session: ${error.message}`);
  }

  return {
    success: true,
    seriesId: data?.series_id,
  };
}

export interface ToggleBookmarkParams {
  userId: string;
  seriesId: string;
  isBookmarked: boolean;
}

/**
 * Toggles "Save for Later" bookmark state.
 */
export async function toggleBookmark({
  userId,
  seriesId,
  isBookmarked,
}: ToggleBookmarkParams): Promise<{ isBookmarked: boolean }> {
  const supabase = getSupabaseClient();

  if (isBookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('series_id', seriesId);

    if (error) {
      throw new Error(`Failed to remove bookmark: ${error.message}`);
    }

    return { isBookmarked: false };
  } else {
    const { error } = await (supabase.from('bookmarks') as any).insert({
      user_id: userId,
      series_id: seriesId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to add bookmark: ${error.message}`);
    }

    return { isBookmarked: true };
  }
}

export interface UpdateLibraryStatusParams {
  userId: string;
  seriesId: string;
  status: LibraryStatus;
}

/**
 * Updates reading shelf category in user's library (READING, PLAN_TO_READ, COMPLETED, DROPPED).
 */
export async function updateLibraryStatus({
  userId,
  seriesId,
  status,
}: UpdateLibraryStatusParams): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await (supabase.from('library') as any).upsert(
    {
      user_id: userId,
      series_id: seriesId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,series_id' }
  );

  if (error) {
    throw new Error(`Failed to update library status: ${error.message}`);
  }
}
