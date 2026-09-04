import { getSupabaseClient } from '../client';
import { ProfileRow, PostRow } from '../types';

export const creatorQueryKeys = {
  all: ['creators'] as const,
  profile: (creatorId: string) => [...creatorQueryKeys.all, 'profile', creatorId] as const,
  featured: () => [...creatorQueryKeys.all, 'featured'] as const,
  posts: (tab?: string) => [...creatorQueryKeys.all, 'posts', tab] as const,
};

/**
 * Fetches creator profile by ID.
 */
export async function fetchCreatorProfile(creatorId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', creatorId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch creator profile: ${error.message}`);
  }

  return (data as ProfileRow) || null;
}

/**
 * Fetches verified/featured creators for discovery.
 */
export async function fetchFeaturedCreators(limit = 6): Promise<ProfileRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'CREATOR')
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured creators: ${error.message}`);
  }

  return (data as ProfileRow[]) || [];
}

/**
 * Fetches Creator Hub community feed posts.
 */
export async function fetchCreatorHubPosts(limit = 20): Promise<PostRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch hub posts: ${error.message}`);
  }

  return (data as PostRow[]) || [];
}
