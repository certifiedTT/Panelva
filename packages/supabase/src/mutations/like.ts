import { getSupabaseClient } from '../client';
import { LikeTargetType } from '../types';

export interface ToggleLikeParams {
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
  isCurrentlyLiked: boolean;
}

/**
 * Toggles like state for a post or chapter.
 */
export async function toggleLike({
  userId,
  targetType,
  targetId,
  isCurrentlyLiked,
}: ToggleLikeParams): Promise<{ isLiked: boolean }> {
  const supabase = getSupabaseClient();

  if (isCurrentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      throw new Error(`Failed to remove like: ${error.message}`);
    }

    return { isLiked: false };
  } else {
    const { error } = await (supabase.from('likes') as any)
      .insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to add like: ${error.message}`);
    }

    return { isLiked: true };
  }
}
