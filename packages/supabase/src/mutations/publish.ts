import { getSupabaseClient } from '../client';
import { ChapterRow, PostRow, ChapterTier, PostType } from '../types';

export interface PublishChapterParams {
  seriesId: string;
  chapterNumber: number;
  title: string;
  tier?: ChapterTier;
  priceCoins?: number;
}

/**
 * Publishes a new episode/chapter to a series.
 */
export async function publishChapter({
  seriesId,
  chapterNumber,
  title,
  tier = ChapterTier.FREE,
  priceCoins = 0,
}: PublishChapterParams): Promise<ChapterRow> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from('chapters') as any)
    .insert({
      series_id: seriesId,
      chapter_number: chapterNumber,
      title,
      tier,
      price_coins: priceCoins,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to publish chapter: ${error.message}`);
  }

  return data as ChapterRow;
}

export interface CreateCreatorPostParams {
  authorId: string;
  content: string;
  type?: PostType;
  mediaUrls?: string[];
}

/**
 * Publishes a community update in Creator Hub.
 */
export async function createCreatorPost({
  authorId,
  content,
  type = PostType.UPDATE,
  mediaUrls = [],
}: CreateCreatorPostParams): Promise<PostRow> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from('posts') as any)
    .insert({
      author_id: authorId,
      content,
      type,
      media_urls: mediaUrls,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to publish creator post: ${error.message}`);
  }

  return data as PostRow;
}
