import { getSupabaseClient } from '../client';
import { CommentRow } from '../types';

export interface CreateCommentParams {
  userId: string;
  content: string;
  postId?: string;
  chapterId?: string;
}

/**
 * Creates a discussion comment on a post or chapter.
 */
export async function createComment({
  userId,
  content,
  postId,
  chapterId,
}: CreateCommentParams): Promise<CommentRow> {
  const supabase = getSupabaseClient();

  if (!postId && !chapterId) {
    throw new Error('Comment must target either a post or a chapter.');
  }

  const { data, error } = await (supabase.from('comments') as any)
    .insert({
      user_id: userId,
      content,
      post_id: postId || null,
      chapter_id: chapterId || null,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to post comment: ${error.message}`);
  }

  return data as CommentRow;
}

/**
 * Deletes a comment by author or moderator.
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('comments').delete().eq('id', commentId);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }

  return true;
}
