import { getSupabaseClient } from '../client';
import {
  WalletTransaction,
  CreditPackage,
  Subscription,
  CreatorWallet,
  CreatorDailyStats,
  Payout,
} from '@panelva/database';

export const monetizationQueryKeys = {
  all: ['monetization'] as const,
  transactions: (userId: string) => [...monetizationQueryKeys.all, 'transactions', userId] as const,
  packages: () => [...monetizationQueryKeys.all, 'packages'] as const,
  subscription: (userId: string) => [...monetizationQueryKeys.all, 'subscription', userId] as const,
  creatorWallet: (creatorId: string) => [...monetizationQueryKeys.all, 'creatorWallet', creatorId] as const,
  creatorDailyStats: (creatorId: string) => [...monetizationQueryKeys.all, 'creatorDailyStats', creatorId] as const,
  payouts: (creatorId: string) => [...monetizationQueryKeys.all, 'payouts', creatorId] as const,
};

/**
 * Fetches ledger transaction history for a reader's wallet.
 */
export async function fetchWalletTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch wallet transactions: ${error.message}`);
  }

  return (data as unknown as WalletTransaction[]) || [];
}

/**
 * Fetches active credit purchase packages from the store.
 */
export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('price_usd', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch credit packages: ${error.message}`);
  }

  return (data as unknown as CreditPackage[]) || [];
}

/**
 * Fetches the active membership subscription for a reader.
 */
export async function fetchUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as unknown as Subscription;
}

/**
 * Fetches real currency earnings for a creator.
 */
export async function fetchCreatorWallet(creatorId: string): Promise<CreatorWallet | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('creator_wallets')
    .select('*')
    .eq('creator_id', creatorId)
    .single();

  if (error) {
    return {
      creator_id: creatorId,
      available: 0,
      pending: 0,
      lifetime: 0,
      updated_at: new Date().toISOString(),
    };
  }

  return data as unknown as CreatorWallet;
}

/**
 * Fetches aggregated daily performance stats for creator dashboards.
 */
export async function fetchCreatorDailyStats(creatorId: string, limit = 30): Promise<CreatorDailyStats[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('creator_daily_stats')
    .select('*')
    .eq('creator_id', creatorId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch daily stats: ${error.message}`);
  }

  return (data as unknown as CreatorDailyStats[]) || [];
}

/**
 * Fetches withdrawal payouts for a creator.
 */
export async function fetchCreatorPayouts(creatorId: string): Promise<Payout[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch payouts: ${error.message}`);
  }

  return (data as unknown as Payout[]) || [];
}
