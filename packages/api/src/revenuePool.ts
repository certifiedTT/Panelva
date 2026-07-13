export interface SeriesConsumptionData {
  seriesId: string;
  totalTimeSpentSeconds: number; // Sum of time spent reading
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  chaptersReadCount: number; // Raw clicks/reads (can be used as reference)
}

export interface RevenuePoolConfig {
  totalPoolAmountUsd: number;
  timeSpentWeight: number; // e.g., 0.60
  engagementWeight: number; // e.g., 0.40
  likeWeight: number; // e.g., 1
  commentWeight: number; // e.g., 5 (comments require high effort)
  bookmarkWeight: number; // e.g., 3
}

interface SeriesPayoutResult {
  seriesId: string;
  combinedScore: number;
  payoutUsd: number;
  rawClicksPayoutUsd: number; // For comparison/analytics to show how the hybrid formula prevents exploitation
}

/**
 * Calculates creator revenue splits from a pooled subscription fund using a hybrid formula:
 * Score = w_time * TimeSpent + w_engage * (a_like * Likes + a_comment * Comments + a_bookmark * Bookmarks)
 * This prevents exploitation where creators spam short daily 4-panel gag content to inflate click metrics.
 */
export function calculatePooledRevenueSplit(
  seriesData: SeriesConsumptionData[],
  config: RevenuePoolConfig
): SeriesPayoutResult[] {
  if (seriesData.length === 0) {
    return [];
  }

  // 1. Calculate individual combined scores and total combined score
  const scoredData = seriesData.map((data) => {
    // Calculate engagement score: weighted sum of likes, comments, and bookmarks
    const engagementScore =
      data.likesCount * config.likeWeight +
      data.commentsCount * config.commentWeight +
      data.bookmarksCount * config.bookmarkWeight;

    // Combined hybrid score: weighted sum of time spent and engagement score
    const combinedScore =
      data.totalTimeSpentSeconds * config.timeSpentWeight +
      engagementScore * config.engagementWeight;

    return {
      seriesId: data.seriesId,
      combinedScore,
      chaptersReadCount: data.chaptersReadCount,
    };
  });

  const totalCombinedScore = scoredData.reduce((acc, s) => acc + s.combinedScore, 0);
  const totalRawClicks = seriesData.reduce((acc, s) => acc + s.chaptersReadCount, 0);

  // 2. Map scores to actual payout amounts in USD
  return scoredData.map((s) => {
    let payoutUsd = 0;
    if (totalCombinedScore > 0) {
      payoutUsd = Number(
        ((s.combinedScore / totalCombinedScore) * config.totalPoolAmountUsd).toFixed(4)
      );
    }

    let rawClicksPayoutUsd = 0;
    if (totalRawClicks > 0) {
      rawClicksPayoutUsd = Number(
        ((s.chaptersReadCount / totalRawClicks) * config.totalPoolAmountUsd).toFixed(4)
      );
    }

    return {
      seriesId: s.seriesId,
      combinedScore: Number(s.combinedScore.toFixed(4)),
      payoutUsd,
      rawClicksPayoutUsd,
    };
  });
}
