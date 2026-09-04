import { getSupabaseClient } from '../client';

export interface ToggleFollowParams {
  followerId: string;
  creatorId: string;
  isCurrentlyFollowing: boolean;
}

/**
 * Toggles follow state for a creator.
 */
export async function toggleFollowCreator({
  followerId,
  creatorId,
  isCurrentlyFollowing,
}: ToggleFollowParams): Promise<{ isFollowing: boolean }> {
  const supabase = getSupabaseClient();

  if (isCurrentlyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('creator_id', creatorId);

    if (error) {
      throw new Error(`Failed to unfollow creator: ${error.message}`);
    }

    return { isFollowing: false };
  } else {
    const { error } = await (supabase.from('follows') as any)
      .insert({
        follower_id: followerId,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to follow creator: ${error.message}`);
    }

    return { isFollowing: true };
  }
}
