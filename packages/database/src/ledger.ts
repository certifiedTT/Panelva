/**
 * Panelva Ledger & Financial Computation Utilities
 * Enforces strict 70/30 creator revenue split and credit transactions.
 */

export interface RevenueSplitResult {
  grossUsd: number;
  creatorShareUsd: number;
  platformShareUsd: number;
  creatorPercentage: number;
  platformPercentage: number;
}

export const CREATOR_SHARE_PERCENT = 70;
export const PLATFORM_SHARE_PERCENT = 30;
export const DEFAULT_CREDIT_RATE_USD = 0.01; // 1 credit = $0.01 USD
export const AD_REWARD_CREDITS = 50;

/**
 * Calculates the exact 70/30 creator-platform revenue split.
 * @param amountCredits Number of credits spent to unlock chapter
 * @param creditRateUsd Dollar conversion rate per credit (default $0.01)
 */
export function calculateRevenueSplit(
  amountCredits: number,
  creditRateUsd: number = DEFAULT_CREDIT_RATE_USD
): RevenueSplitResult {
  if (amountCredits <= 0) {
    return {
      grossUsd: 0,
      creatorShareUsd: 0,
      platformShareUsd: 0,
      creatorPercentage: CREATOR_SHARE_PERCENT,
      platformPercentage: PLATFORM_SHARE_PERCENT,
    };
  }

  const grossUsd = Number((amountCredits * creditRateUsd).toFixed(4));
  const creatorShareUsd = Math.round(grossUsd * CREATOR_SHARE_PERCENT) / 100;
  const platformShareUsd = Number((grossUsd - creatorShareUsd).toFixed(2));

  return {
    grossUsd,
    creatorShareUsd,
    platformShareUsd,
    creatorPercentage: CREATOR_SHARE_PERCENT,
    platformPercentage: PLATFORM_SHARE_PERCENT,
  };
}

/**
 * Verifies if user has sufficient credits to unlock a chapter.
 */
export function canAffordUnlock(currentCredits: number, requiredCredits: number): boolean {
  return currentCredits >= requiredCredits && requiredCredits > 0;
}
