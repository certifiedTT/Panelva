import { describe, it, expect } from "vitest";
import { calculatePooledRevenueSplit, SeriesConsumptionData, RevenuePoolConfig } from "./revenuePool";

describe("calculatePooledRevenueSplit", () => {
  const config: RevenuePoolConfig = {
    totalPoolAmountUsd: 10000,
    timeSpentWeight: 0.6,
    engagementWeight: 0.4,
    likeWeight: 1,
    commentWeight: 5,
    bookmarkWeight: 3,
  };

  it("distributes pooled revenue according to the hybrid formula and prevents raw click exploitation", () => {
    const seriesData: SeriesConsumptionData[] = [
      {
        seriesId: "gag-spam-series",
        totalTimeSpentSeconds: 600, // Readers spent very little time (short 4-panel gag gif)
        likesCount: 10,
        commentsCount: 1,
        bookmarksCount: 2,
        chaptersReadCount: 100, // Inflated raw clicks/clicks!
      },
      {
        seriesId: "detailed-action-series",
        totalTimeSpentSeconds: 54000, // Readers spent a lot of time (massive detailed action chapter)
        likesCount: 500,
        commentsCount: 80,
        bookmarksCount: 120,
        chaptersReadCount: 20, // Low raw clicks!
      },
    ];

    const result = calculatePooledRevenueSplit(seriesData, config);

    expect(result).toHaveLength(2);

    const gagPayout = result.find((r) => r.seriesId === "gag-spam-series")!;
    const actionPayout = result.find((r) => r.seriesId === "detailed-action-series")!;

    // Action series spent reading time and engagement should dominate the payouts
    expect(actionPayout.payoutUsd).toBeGreaterThan(gagPayout.payoutUsd);

    // Let's compare with what they would receive under the old raw clicks method:
    // Gag series would get 100 / 120 = 83.3% of the pool ($8333.33)
    // Action series would get 20 / 120 = 16.6% of the pool ($1666.67)
    // Under our hybrid formula, Action gets the majority of the payout!
    expect(actionPayout.payoutUsd).toBeGreaterThan(5000); // gets more than 50%
    expect(gagPayout.payoutUsd).toBeLessThan(1000); // gets less than 10%
  });
});
