/**
 * Collaborative Series Revenue Split Engine
 * Principle: Revenue splits must total exactly 100.00%.
 */

export interface SplitEntry {
  memberId: string;
  percentage: number;
  role?: string;
}

export interface SplitValidationResult {
  isValid: boolean;
  totalPercentage: number;
  error?: string;
}

export interface CollaboratorPayoutResult {
  memberId: string;
  role?: string;
  percentage: number;
  amountUsd: number;
}

/**
 * Validates that all collaborative split percentages total exactly 100.00%.
 */
export function validateRevenueSplits(splits: Pick<SplitEntry, 'percentage'>[]): SplitValidationResult {
  if (!splits || splits.length === 0) {
    return {
      isValid: false,
      totalPercentage: 0,
      error: 'At least one collaborator split is required.',
    };
  }

  // Check individual bounds
  for (const split of splits) {
    if (split.percentage <= 0 || split.percentage > 100) {
      return {
        isValid: false,
        totalPercentage: 0,
        error: `Individual percentage ${split.percentage}% is out of bounds (must be 0.01 - 100.00).`,
      };
    }
  }

  const rawSum = splits.reduce((acc, curr) => acc + curr.percentage, 0);
  const totalPercentage = Number(rawSum.toFixed(2));

  if (Math.abs(totalPercentage - 100.0) > 0.01) {
    return {
      isValid: false,
      totalPercentage,
      error: `Revenue splits must total exactly 100.00%. Current total: ${totalPercentage}%.`,
    };
  }

  return {
    isValid: true,
    totalPercentage: 100.0,
  };
}

/**
 * Distributes chapter earnings among studio team members based on validated percentages.
 * @param netEarningsUsd Net dollar earnings to be distributed
 * @param splits Validated array of member splits
 */
export function calculateCollaboratorPayouts(
  netEarningsUsd: number,
  splits: SplitEntry[]
): CollaboratorPayoutResult[] {
  if (netEarningsUsd <= 0 || splits.length === 0) {
    return [];
  }

  return splits.map((split) => {
    const amountUsd = Number(((netEarningsUsd * split.percentage) / 100).toFixed(2));
    return {
      memberId: split.memberId,
      role: split.role,
      percentage: split.percentage,
      amountUsd,
    };
  });
}
