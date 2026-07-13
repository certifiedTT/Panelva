import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@panelva/db";
import { updateSeriesTiers } from "./chapterLifecycleWorker";

describe("Chapter Lifecycle 3/3/4 Ratio transitions", () => {
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
        title: "Test Lifecycle Series",
        description: "Testing deterministic 3/3/4 transitions",
        coverUrl: "https://example.com/cover.jpg",
        type: "COMIC",
        creatorId: creator.id,
      },
    });

    creatorId = creator.id;
    seriesId = series.id;
  });

  it("partitions 1 chapter correctly as PREMIUM", async () => {
    await prisma.chapter.create({
      data: {
        seriesId,
        title: "Chapter 1",
        chapterIndex: 1,
        tier: "FREE",
      },
    });

    await updateSeriesTiers(seriesId);

    const chapters = await prisma.chapter.findMany({
      where: { seriesId },
      orderBy: { chapterIndex: "asc" },
    });
    expect(chapters).toHaveLength(1);
    expect(chapters[0].tier).toBe("PREMIUM");
  });

  it("partitions 3 chapters correctly as 1 FREE, 1 AD_SUPPORTED, 1 PREMIUM", async () => {
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
    // Sort asc: idx 1, 2, 3
    // 3/3/4 for N=3: Math.round(3*0.4)=1 Premium, Math.round(3*0.3)=1 Ad, N-1-1=1 Free
    expect(chapters[0].tier).toBe("FREE");
    expect(chapters[1].tier).toBe("AD_SUPPORTED");
    expect(chapters[2].tier).toBe("PREMIUM");
  });

  it("partitions 10 chapters correctly as 3 FREE, 3 AD_SUPPORTED, 4 PREMIUM (3/3/4 exact ratio)", async () => {
    // Currently we have 3 chapters. Add 7 more.
    for (let idx = 4; idx <= 10; idx++) {
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
    expect(chapters).toHaveLength(10);

    const freeCount = chapters.filter((c) => c.tier === "FREE").length;
    const adCount = chapters.filter((c) => c.tier === "AD_SUPPORTED").length;
    const premiumCount = chapters.filter((c) => c.tier === "PREMIUM").length;

    expect(freeCount).toBe(3);
    expect(adCount).toBe(3);
    expect(premiumCount).toBe(4);
  });
});
