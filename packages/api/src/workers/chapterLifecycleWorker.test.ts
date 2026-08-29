import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@panelva/db";
import { updateSeriesTiers } from "./chapterLifecycleWorker";

describe("Intelligent Chapter Access System & Progression lifecycle", () => {
  let creatorId: string;
  let seriesId: string;

  beforeAll(async () => {
    // Setup test creator and series
    const user = await prisma.user.create({
      data: {
        email: `creator-lifecycle-${Date.now()}@example.com`,
        username: `creator_lifecycle_${Date.now()}`,
        role: "CREATOR",
      },
    });

    const creator = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        penName: `LifecycleArtist_${Date.now()}`,
        portfolioUrl: "https://portfolio.example.com",
        type: "ARTIST",
        isVetted: true,
      },
    });

    const series = await prisma.series.create({
      data: {
        title: "Test Lifecycle Series " + Date.now(),
        description: "Testing intelligent progressive transitions",
        coverUrl: "https://example.com/cover.jpg",
        type: "COMIC",
        creatorId: creator.id,
      },
    });

    creatorId = creator.id;
    seriesId = series.id;
  });

  it("partitions 1 chapter correctly as AD_SUPPORTED (Watch to Unlock)", async () => {
    const ch = await prisma.chapter.create({
      data: {
        seriesId,
        title: "Chapter 1",
        chapterIndex: 1,
        tier: "FREE",
      },
    });

    await updateSeriesTiers(seriesId);

    const updatedCh = await prisma.chapter.findUnique({ where: { id: ch.id } });
    expect(updatedCh?.tier).toBe("AD_SUPPORTED");
  });

  it("partitions 3 chapters correctly as 1 FREE, 1 AD_SUPPORTED, 1 PREMIUM", async () => {
    // Reset initial distributed flag for test
    await prisma.series.update({
      where: { id: seriesId },
      data: { isInitiallyDistributed: false }
    });

    await prisma.chapter.create({
      data: {
        seriesId,
        title: "Chapter 2",
        chapterIndex: 2,
        tier: "FREE",
      },
    });
    await prisma.chapter.create({
      data: {
        seriesId,
        title: "Chapter 3",
        chapterIndex: 3,
        tier: "FREE",
      },
    });

    await updateSeriesTiers(seriesId);

    const chapters = await prisma.chapter.findMany({
      where: { seriesId },
      orderBy: { chapterIndex: "asc" },
    });
    expect(chapters).toHaveLength(3);
    expect(chapters[0].tier).toBe("FREE");
    expect(chapters[1].tier).toBe("AD_SUPPORTED");
    expect(chapters[2].tier).toBe("PREMIUM");
  });

  it("staggers Premium chapters during bulk releases", async () => {
    // Clean series chapters and recreate 6 chapters
    await prisma.chapter.deleteMany({ where: { seriesId } });
    await prisma.series.update({
      where: { id: seriesId },
      data: { isInitiallyDistributed: false }
    });

    for (let idx = 1; idx <= 6; idx++) {
      await prisma.chapter.create({
        data: {
          seriesId,
          title: `Chapter ${idx}`,
          chapterIndex: idx,
          tier: "FREE",
        },
      });
    }

    await updateSeriesTiers(seriesId);

    const chapters = await prisma.chapter.findMany({
      where: { seriesId },
      orderBy: { chapterIndex: "asc" },
    });
    expect(chapters).toHaveLength(6);
    // N=6: X=2 => 2 Free, 2 Ad, 2 Premium
    expect(chapters[0].tier).toBe("FREE");
    expect(chapters[1].tier).toBe("FREE");
    expect(chapters[2].tier).toBe("AD_SUPPORTED");
    expect(chapters[3].tier).toBe("AD_SUPPORTED");
    expect(chapters[4].tier).toBe("PREMIUM");
    expect(chapters[5].tier).toBe("PREMIUM");

    // Check stagger dates
    const unlock4 = chapters[4].waitTierDropAt;
    const unlock5 = chapters[5].waitTierDropAt;
    expect(unlock4).not.toBeNull();
    expect(unlock5).not.toBeNull();
    const diff = unlock5!.getTime() - unlock4!.getTime();
    expect(diff).toBeGreaterThanOrEqual(6 * 24 * 3600 * 1000); // approx 7 days stagger
  });

  it("pauses progression timers during creator inactivity", async () => {
    // Make latest chapter created 15 days ago
    const chapters = await prisma.chapter.findMany({ where: { seriesId } });
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 3600 * 1000);
    
    for (const ch of chapters) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { createdAt: fifteenDaysAgo }
      });
    }

    await updateSeriesTiers(seriesId);

    const updatedSeries = await prisma.series.findUnique({ where: { id: seriesId } });
    expect(updatedSeries?.isProgressionPaused).toBe(true);
    expect(updatedSeries?.progressionPausedAt).not.toBeNull();
  });
});
