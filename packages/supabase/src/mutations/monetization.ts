import { getSupabaseClient } from '../client';
import { Payout, PayoutStatus } from '@panelva/database';

export interface UnlockChapterParams {
  userId: string;
  chapterId: string;
  priceCoins: number;
}

/**
 * Unlocks a chapter using reader credits and allocates 70% revenue to creator.
 */
export async function unlockChapterWithCredits({
  userId,
  chapterId,
  priceCoins,
}: UnlockChapterParams): Promise<{ success: boolean; creatorShareUsd: number }> {
  const supabase = getSupabaseClient();
  const { data, error } = await (supabase as any).rpc('process_chapter_unlock_revenue', {
    p_user_id: userId,
    p_chapter_id: chapterId,
    p_amount_coins: priceCoins,
  });

  if (error) {
    throw new Error(`Failed to unlock chapter: ${error.message}`);
  }

  return {
    success: true,
    creatorShareUsd: data?.creator_share_usd || 0,
  };
}

/**
 * Grants +50 credits upon completion of an ad reward session.
 */
export async function claimAdReward(userId: string): Promise<{ success: boolean; rewardCredits: number }> {
  const supabase = getSupabaseClient();
  const { data, error } = await (supabase as any).rpc('grant_ad_reward', {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to grant ad reward: ${error.message}`);
  }

  return {
    success: true,
    rewardCredits: data?.reward_credits || 50,
  };
}

export interface RequestPayoutParams {
  creatorId: string;
  amount: number;
}

/**
 * Submits a creator withdrawal payout request (min $50.00).
 */
export async function requestCreatorPayout({
  creatorId,
  amount,
}: RequestPayoutParams): Promise<Payout> {
  if (amount < 50) {
    throw new Error('Minimum creator payout withdrawal is $50.00.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await (supabase.from('payouts') as any)
    .insert({
      creator_id: creatorId,
      amount,
      status: PayoutStatus.PENDING,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to request payout: ${error.message}`);
  }

  return data as unknown as Payout;
}

/**
 * Records an episode view event for aggregated analytics.
 */
export async function recordChapterView(chapterId: string, userId?: string): Promise<void> {
  const supabase = getSupabaseClient();
  await (supabase.from('chapter_views') as any).insert({
    chapter_id: chapterId,
    user_id: userId || null,
    viewed_at: new Date().toISOString(),
  });
}

/**
 * Updates reading progress percent and completion status.
 */
export async function updateReadProgress(
  userId: string,
  chapterId: string,
  progressPercent: number
): Promise<void> {
  const supabase = getSupabaseClient();
  const completed = progressPercent >= 90;

  await (supabase.from('read_progress') as any).upsert(
    {
      user_id: userId,
      chapter_id: chapterId,
      progress_percent: progressPercent,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,chapter_id' }
  );
}
