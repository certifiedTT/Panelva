import { getSupabaseClient } from '../client';
import { ProfileRow, WalletRow, NotificationRow } from '../types';

export const profileQueryKeys = {
  all: ['profile'] as const,
  user: (userId: string) => [...profileQueryKeys.all, 'user', userId] as const,
  wallet: (userId: string) => [...profileQueryKeys.all, 'wallet', userId] as const,
  notifications: (userId: string) => [...profileQueryKeys.all, 'notifications', userId] as const,
};

/**
 * Fetches user profile by user ID.
 */
export async function fetchUserProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return (data as ProfileRow) || null;
}

/**
 * Fetches wallet balance for an authenticated user.
 */
export async function fetchUserWallet(userId: string): Promise<WalletRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Return default zero wallet if not yet created
    return {
      user_id: userId,
      credits_balance: 0,
      coins_balance: 0,
      updated_at: new Date().toISOString(),
    };
  }

  return (data as WalletRow) || null;
}

/**
 * Fetches alerts/notifications for an authenticated user.
 */
export async function fetchUserNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return (data as NotificationRow[]) || [];
}
