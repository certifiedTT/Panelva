import { prisma } from "@panelva/db";

/**
 * Intelligent Chapter Access System
 * Preserves creator revenue and reader experience.
 */
export async function updateSeriesTiers(seriesId: string, txClient?: any): Promise<void> {
  const client = txClient || prisma;

  // 1. Fetch series and its chapters sorted by chapterIndex ascending
  const series = await client.series.findUnique({
    where: { id: seriesId },
    include: { chapters: { orderBy: { chapterIndex: "asc" } } }
  });

  if (!series) return;
  const chapters = series.chapters;
  const N = chapters.length;
  if (N === 0) return;

  const now = new Date();

  // 2. Creator Inactivity Protection check
  // Find the latest uploaded chapter based on createdAt
  const sortedByCreated = [...chapters].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const latestChapter = sortedByCreated[0];
  const fourteenDaysMs = 14 * 24 * 3600 * 1000;
  const inactive = (now.getTime() - latestChapter.createdAt.getTime()) > fourteenDaysMs;

  let isPaused = series.isProgressionPaused;
  let pausedAt = series.progressionPausedAt;

  if (inactive && !isPaused) {
    // Transition to Paused status: stop all active countdown timers
    isPaused = true;
    pausedAt = now;
    await client.series.update({
      where: { id: seriesId },
      data: { isProgressionPaused: true, progressionPausedAt: now }
    });
  } else if (!inactive && isPaused && pausedAt) {
    // Transition to Active status: resume paused countdown timers by shifting the dates
    const pausedDurationMs = now.getTime() - pausedAt.getTime();
    isPaused = false;
    
    // Shift waitTierDropAt forward for all pending chapters
    for (const ch of chapters) {
      if (ch.waitTierDropAt) {
        const newUnlockDate = new Date(ch.waitTierDropAt.getTime() + pausedDurationMs);
        await client.chapter.update({
          where: { id: ch.id },
          data: { waitTierDropAt: newUnlockDate }
        });
      }
    }

    await client.series.update({
      where: { id: seriesId },
      data: { isProgressionPaused: false, progressionPausedAt: null }
    });
  }

  // If the progression timers are active and not paused, check progression
  if (!isPaused) {
    // 3. Initial Series Distribution (runs only during first publication of a series)
    if (!series.isInitiallyDistributed) {
      if (N === 1) {
        // 1 Chapter -> Watch to Unlock
        await client.chapter.update({
          where: { id: chapters[0].id },
          data: { tier: "AD_SUPPORTED", waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) }
        });
      } else if (N === 2) {
        // 2 Chapters -> Watch to Unlock, Premium
        await client.chapter.update({
          where: { id: chapters[0].id },
          data: { tier: "AD_SUPPORTED", waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) }
        });
        await client.chapter.update({
          where: { id: chapters[1].id },
          data: { tier: "PREMIUM", waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) }
        });
      } else if (N === 3) {
        // 3 Chapters -> Free, Watch to Unlock, Premium
        await client.chapter.update({
          where: { id: chapters[0].id },
          data: { tier: "FREE", waitTierDropAt: null }
        });
        await client.chapter.update({
          where: { id: chapters[1].id },
          data: { tier: "AD_SUPPORTED", waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) }
        });
        await client.chapter.update({
          where: { id: chapters[2].id },
          data: { tier: "PREMIUM", waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) }
        });
      } else {
        // More than 3 Chapters: Free and Watch to Unlock balanced, Premium largest portion
        const X = Math.floor(N / 3);
        const freeCount = X;
        const adCount = X;
        const premiumCount = N - 2 * X;

        let premiumStaggerIdx = 0;

        for (let i = 0; i < N; i++) {
          const ch = chapters[i];
          if (i < freeCount) {
            await client.chapter.update({
              where: { id: ch.id },
              data: { tier: "FREE", waitTierDropAt: null }
            });
          } else if (i < freeCount + adCount) {
            await client.chapter.update({
              where: { id: ch.id },
              data: { tier: "AD_SUPPORTED", waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) }
            });
          } else {
            // Bulk release premium chapters: stagger progression offsets
            premiumStaggerIdx++;
            const staggerDays = 7 * premiumStaggerIdx;
            await client.chapter.update({
              where: { id: ch.id },
              data: { tier: "PREMIUM", waitTierDropAt: new Date(now.getTime() + staggerDays * 24 * 3600 * 1000) }
            });
          }
        }
      }

      // Mark initial distribution completed
      await client.series.update({
        where: { id: seriesId },
        data: { isInitiallyDistributed: true }
      });
    } else {
      // 4. Automatic Chapter Progression (transitions for existing chapters)
      // Check countdowns and advance expired timers
      for (const ch of chapters) {
        if (ch.waitTierDropAt && ch.waitTierDropAt <= now) {
          if (ch.tier === "PREMIUM") {
            // Premium -> 7 Days -> Watch to Unlock
            await client.chapter.update({
              where: { id: ch.id },
              data: { 
                tier: "AD_SUPPORTED", 
                waitTierDropAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) 
              }
            });
          } else if (ch.tier === "AD_SUPPORTED") {
            // Watch to Unlock -> 7 Days -> Free
            await client.chapter.update({
              where: { id: ch.id },
              data: { 
                tier: "FREE", 
                waitTierDropAt: null 
              }
            });
          }
        }
      }
    }
  }
}

/**
 * Background job scanning all ongoing series and running lifecycle checks
 */
export async function runChapterLifecycleJob(txClient?: any): Promise<number> {
  const client = txClient || prisma;
  
  const seriesList = await client.series.findMany({
    where: { status: "ONGOING" },
  });

  let processedCount = 0;
  for (const series of seriesList) {
    await client.$transaction(async (tx: any) => {
      await updateSeriesTiers(series.id, tx);
    });
    processedCount++;
  }

  return processedCount;
}
