import { prisma } from "@panelva/db";

/**
 * Recalculates and updates the tiers of all chapters for a given series
 * to align with the 3/3/4 ratio (30% Free, 30% Ad-Locked, 40% Premium).
 * 
 * Sorts chapters by chapterIndex ascending.
 */
export async function updateSeriesTiers(seriesId: string, txClient?: any): Promise<void> {
  const client = txClient || prisma;

  // 1. Fetch all chapters in the series, sorted by chapterIndex ascending
  const chapters = await client.chapter.findMany({
    where: { seriesId },
    orderBy: { chapterIndex: "asc" },
  });

  const N = chapters.length;
  if (N === 0) return;

  // 2. Deterministically split based on 3/3/4 ratio
  // Premium: newest 40% of chapters
  // Ad-locked: middle 30% of chapters
  // Free: oldest 30% of chapters
  let premiumCount = Math.max(1, Math.round(N * 0.4));
  let adCount = Math.round(N * 0.3);
  let freeCount = N - premiumCount - adCount;

  if (freeCount < 0) {
    freeCount = 0;
    adCount = N - premiumCount;
  }

  // 3. Update each chapter's tier in the database if it differs
  for (let i = 0; i < N; i++) {
    let targetTier = "FREE";
    if (i >= freeCount + adCount) {
      targetTier = "PREMIUM";
    } else if (i >= freeCount) {
      targetTier = "AD_SUPPORTED";
    }

    if (chapters[i].tier !== targetTier) {
      await client.chapter.update({
        where: { id: chapters[i].id },
        data: { tier: targetTier },
      });
    }
  }
}

/**
 * Idempotent background job to scan all ongoing series and align their chapters with the 3/3/4 ratio.
 */
export async function runChapterLifecycleJob(txClient?: any): Promise<number> {
  const client = txClient || prisma;
  
  // Find all ongoing series
  const seriesList = await client.series.findMany({
    where: { status: "ONGOING" },
  });

  let processedCount = 0;
  for (const series of seriesList) {
    // Process each series in a transaction to ensure isolation and idempotency
    await client.$transaction(async (tx: any) => {
      await updateSeriesTiers(series.id, tx);
    });
    processedCount++;
  }

  return processedCount;
}
