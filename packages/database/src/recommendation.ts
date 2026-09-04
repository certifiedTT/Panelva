/**
 * Panelva Recommendation & Discovery Scoring Engines
 * Weighted multi-factor algorithms for Home feed, Trending, and Creator Hub.
 */

export interface HomeRankingInputs {
  viewsScore: number;       // 0-100 normalized view volume
  completionRate: number;   // 0-100 reader completion percentage
  followsCount: number;     // 0-100 creator/series follower momentum
  genreMatchScore: number;  // 100 for exact user match, 50 related, 10 default
  freshnessScore: number;   // 0-100 recency score (days since release)
}

/**
 * Calculates Home feed personalized score.
 * Formula: Score = (Views * 0.30) + (Completion * 0.25) + (Follows * 0.20) + (GenreMatch * 0.15) + (Freshness * 0.10)
 */
export function calculateHomeSeriesScore(inputs: HomeRankingInputs): number {
  const score =
    inputs.viewsScore * 0.30 +
    inputs.completionRate * 0.25 +
    inputs.followsCount * 0.20 +
    inputs.genreMatchScore * 0.15 +
    inputs.freshnessScore * 0.10;

  return Number(score.toFixed(2));
}

export interface TrendingInputs {
  readsScore: number;       // 35%
  completionRate: number;   // 25%
  likesCount: number;       // 15%
  commentsCount: number;    // 15%
  sharesCount: number;      // 10%
}

/**
 * Calculates 24h Algorithmic Trending score.
 * Formula: Score = (Reads * 0.35) + (Completion * 0.25) + (Likes * 0.15) + (Comments * 0.15) + (Shares * 0.10)
 * Prevents clickbait covers from dominating by weighting actual reads and completions at 60%.
 */
export function calculateTrendingScore(inputs: TrendingInputs): number {
  const score =
    inputs.readsScore * 0.35 +
    inputs.completionRate * 0.25 +
    inputs.likesCount * 0.15 +
    inputs.commentsCount * 0.15 +
    inputs.sharesCount * 0.10;

  return Number(score.toFixed(2));
}

export interface CreatorRankingInputs {
  followersScore: number;         // 30%
  engagementScore: number;        // 30%
  postingConsistencyScore: number;// 20%
  readerGrowthScore: number;      // 20%
}

/**
 * Calculates Creator Hub discovery ranking.
 * Formula: Score = (Followers * 0.30) + (Engagement * 0.30) + (Posting Consistency * 0.20) + (Reader Growth * 0.20)
 * Allows fast-growing, active emerging creators to outrank dormant legacy accounts.
 */
export function calculateCreatorScore(inputs: CreatorRankingInputs): number {
  const score =
    inputs.followersScore * 0.30 +
    inputs.engagementScore * 0.30 +
    inputs.postingConsistencyScore * 0.20 +
    inputs.readerGrowthScore * 0.20;

  return Number(score.toFixed(2));
}

export interface HomeFeedSections<T extends { id: string }> {
  continueReading: T[];
  trending: T[];
  genreRecommended: T[];
  creatorSpotlight: T[];
}

/**
 * Deduplicates series across personalized home sections.
 * Enforces rule: Never show the same series in multiple sections.
 */
export function deduplicateHomeSections<T extends { id: string }>(
  sections: HomeFeedSections<T>
): HomeFeedSections<T> {
  const seenIds = new Set<string>();

  const filterDisjoint = (list: T[]): T[] => {
    const unique: T[] = [];
    for (const item of list) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  };

  return {
    continueReading: filterDisjoint(sections.continueReading),
    trending: filterDisjoint(sections.trending),
    genreRecommended: filterDisjoint(sections.genreRecommended),
    creatorSpotlight: filterDisjoint(sections.creatorSpotlight),
  };
}
