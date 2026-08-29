import { Prisma } from "@panelva/db";

interface PayoutRecipient {
  userId: string;
  shareRatio: Prisma.Decimal;
}

interface SplitResult {
  userId: string;
  amountUsd: number;
}

/**
 * Calculates creator splits after platform cuts
 * @param giftValueCredits The Credits sent as a gift
 * @param collaborators List of collaborators with their configured splits
 * @returns Split payouts in USD equivalent
 */
export function calculatePayoutSplit(
  giftValueCredits: number,
  collaborators: PayoutRecipient[]
): SplitResult[] {
  // 1. platform cut = 25%
  const panelvaCutRatio = 0.25;
  const netCredits = giftValueCredits * (1 - panelvaCutRatio);
  // Convert Credits to USD cents value: 50 Credits = 100 cents -> 1 Credit = 2 cents
  const totalCentsValue = netCredits * 2;

  if (collaborators.length === 0) {
    return [];
  }

  let cumulativeCents = 0;
  let cumulativeRounded = 0;

  // Calculate split based on collaborator ratios using telescoping running totals
  return collaborators.map((collab) => {
    const ratioPercentage = Number(collab.shareRatio) / 100;
    const exactShare = totalCentsValue * ratioPercentage;
    
    cumulativeCents += exactShare;
    const nextRounded = Math.round(cumulativeCents);
    const individualShare = nextRounded - cumulativeRounded;
    cumulativeRounded = nextRounded;

    return {
      userId: collab.userId,
      amountUsd: individualShare, // Representing exact cents
    };
  });
}
