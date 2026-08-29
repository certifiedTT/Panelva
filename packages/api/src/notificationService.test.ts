import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, UserRole, SeriesStatus } from "@panelva/db";
import { FollowerNotificationService } from "./services/notificationService";
import { appRouter } from "./routers";
import { createTRPCContext } from "./context";

describe("Creator Follow Notifications & Series Status Management", () => {
  let creatorUser: any;
  let creatorProfile: any;
  let followerOfCreator: any;
  let followerOfSeries: any;
  let followerOfBoth: any;
  let series: any;

  beforeAll(async () => {
    const suffix = Date.now();

    // 1. Create Creator User and Profile
    creatorUser = await prisma.user.create({
      data: {
        email: `creator-${suffix}@panelva.com`,
        username: `creator_${suffix}`,
        role: UserRole.CREATOR,
      },
    });

    creatorProfile = await prisma.creatorProfile.create({
      data: {
        userId: creatorUser.id,
        penName: `Author_${suffix}`,
        type: "WRITER",
        portfolioUrl: "https://example.com/author",
        isVetted: true,
      },
    });

    // 2. Create Readers
    followerOfCreator = await prisma.user.create({
      data: {
        email: `follower-creator-${suffix}@panelva.com`,
        username: `f_creator_${suffix}`,
        role: UserRole.USER,
      },
    });

    followerOfSeries = await prisma.user.create({
      data: {
        email: `follower-series-${suffix}@panelva.com`,
        username: `f_series_${suffix}`,
        role: UserRole.USER,
      },
    });

    followerOfBoth = await prisma.user.create({
      data: {
        email: `follower-both-${suffix}@panelva.com`,
        username: `f_both_${suffix}`,
        role: UserRole.USER,
      },
    });

    // 3. Setup Creator Follows
    await prisma.creatorFollow.create({
      data: {
        userId: followerOfCreator.id,
        creatorProfileId: creatorProfile.id,
      },
    });

    await prisma.creatorFollow.create({
      data: {
        userId: followerOfBoth.id,
        creatorProfileId: creatorProfile.id,
      },
    });

    // 4. Create a test series
    series = await prisma.series.create({
      data: {
        title: `Epic Chronicles ${suffix}`,
        description: "A grand fantasy saga",
        coverUrl: "https://example.com/cover.jpg",
        type: "COMIC",
        creatorId: creatorProfile.id,
        status: SeriesStatus.ONGOING,
      },
    });

    // 5. Setup Series Follows
    await prisma.follow.create({
      data: {
        userId: followerOfSeries.id,
        seriesId: series.id,
      },
    });

    await prisma.follow.create({
      data: {
        userId: followerOfBoth.id,
        seriesId: series.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up created entities
    if (series) {
      await prisma.notification.deleteMany({ where: { seriesId: series.id } });
      await prisma.follow.deleteMany({ where: { seriesId: series.id } });
      await prisma.chapter.deleteMany({ where: { seriesId: series.id } });
      await prisma.series.deleteMany({ where: { id: series.id } });
    }
    if (creatorProfile) {
      await prisma.creatorFollow.deleteMany({ where: { creatorProfileId: creatorProfile.id } });
      await prisma.creatorProfile.deleteMany({ where: { id: creatorProfile.id } });
    }
    const userIds = [creatorUser?.id, followerOfCreator?.id, followerOfSeries?.id, followerOfBoth?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  });

  it("1. notifyNewSeries generates notifications with exact title and body for creator followers only", async () => {
    const res = await FollowerNotificationService.notifyNewSeries({
      creatorProfileId: creatorProfile.id,
      seriesId: series.id,
      seriesTitle: series.title,
      creatorName: creatorProfile.penName,
      senderUserId: creatorUser.id,
    });

    expect(res.count).toBe(2); // followerOfCreator and followerOfBoth

    const notifs = await prisma.notification.findMany({
      where: { seriesId: series.id, type: "new_series" },
    });

    expect(notifs.length).toBe(2);
    expect(notifs[0].title).toBe(`New series from ${creatorProfile.penName}`);
    expect(notifs[0].body).toBe(`*${series.title}* has just been published. Start reading now.`);
    expect(notifs[0].type).toBe("new_series");

    const userIds = notifs.map((n) => n.userId);
    expect(userIds).toContain(followerOfCreator.id);
    expect(userIds).toContain(followerOfBoth.id);
    expect(userIds).not.toContain(followerOfSeries.id); // Series-only follower does NOT receive new_series for this creator
  });

  it("2. notifyNewChapter deduplicates notifications when a user follows BOTH creator and series", async () => {
    // Clear notifications for clean assertions
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });

    const res = await FollowerNotificationService.notifyNewChapter({
      seriesId: series.id,
      chapterIndex: 5,
      seriesTitle: series.title,
      creatorProfileId: creatorProfile.id,
      senderUserId: creatorUser.id,
    });

    // Recipients: followerOfSeries (1), followerOfCreator (1), followerOfBoth (1, deduplicated) = total 3
    expect(res.count).toBe(3);

    const notifs = await prisma.notification.findMany({
      where: { seriesId: series.id, type: "new_chapter" },
    });

    expect(notifs.length).toBe(3);
    expect(notifs[0].title).toBe("New chapter available");
    expect(notifs[0].body).toBe(`Chapter 5 of *${series.title}* is now available.`);

    const userIds = notifs.map((n) => n.userId);
    expect(userIds).toContain(followerOfCreator.id);
    expect(userIds).toContain(followerOfSeries.id);
    expect(userIds).toContain(followerOfBoth.id);

    // followerOfBoth should have EXACTLY 1 notification for this chapter
    const bothNotifs = notifs.filter((n) => n.userId === followerOfBoth.id);
    expect(bothNotifs.length).toBe(1);
  });

  it("3. notifyStatusChange supports all 5 statuses with correct titles and bodies", async () => {
    // 3A: HIATUS
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.HIATUS,
      creatorProfileId: creatorProfile.id,
    });

    let notifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    expect(notifs[0].title).toBe("Series is on hiatus");
    expect(notifs[0].body).toBe(`*${series.title}* is taking a short break. You'll be notified when it returns.`);

    // 3B: SEASON_ENDED
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.SEASON_ENDED,
      seasonNumber: 2,
      creatorProfileId: creatorProfile.id,
    });

    notifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    expect(notifs[0].title).toBe("Season completed");
    expect(notifs[0].body).toBe(`Season 2 of *${series.title}* has officially ended.`);

    // 3C: NEW_SEASON_COMING
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.NEW_SEASON_COMING,
      creatorProfileId: creatorProfile.id,
    });

    notifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    expect(notifs[0].title).toBe("A new season is coming");
    expect(notifs[0].body).toBe(`*${series.title}* will return with a new season soon.`);

    // 3D: COMING_SOON
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.COMING_SOON,
      creatorProfileId: creatorProfile.id,
    });

    notifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    expect(notifs[0].title).toBe("Coming Soon");
    expect(notifs[0].body).toBe(`*${series.title}* has been announced. Follow the series to receive updates.`);

    // 3E: ONGOING with custom statusMessage
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.ONGOING,
      statusMessage: "We are back with weekly Monday releases!",
      creatorProfileId: creatorProfile.id,
    });

    notifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    expect(notifs[0].title).toBe("Series returned to Ongoing");
    expect(notifs[0].body).toContain("We are back with weekly Monday releases!");
  });

  it("4. series.updateStatus tRPC mutation updates status in DB and dispatches notifications", async () => {
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });

    const caller = appRouter.createCaller({
      prisma,
      session: {
        userId: creatorUser.id,
        email: creatorUser.email,
        role: UserRole.CREATOR,
      },
    } as any);

    const updated = await caller.series.updateStatus({
      seriesId: series.id,
      status: SeriesStatus.HIATUS,
      statusMessage: "Creator is recovering from surgery. Back in 3 weeks.",
    });

    expect(updated.status).toBe(SeriesStatus.HIATUS);
    expect(updated.statusMessage).toBe("Creator is recovering from surgery. Back in 3 weeks.");
    expect(updated.statusUpdatedAt).toBeDefined();

    // Verify notifications were delivered
    const notifs = await prisma.notification.findMany({
      where: { seriesId: series.id },
    });
    expect(notifs.length).toBe(3); // 3 unique followers
  });

  it("5. user router retrieves reader notifications and manages read status", async () => {
    const caller = appRouter.createCaller({
      prisma,
      session: {
        userId: followerOfBoth.id,
        email: followerOfBoth.email,
        role: UserRole.USER,
      },
    } as any);

    // Fetch notifications
    const list = await caller.user.getReaderNotifications();
    expect(list.length).toBeGreaterThan(0);

    const unreadCountBefore = await caller.user.getUnreadNotificationCount();
    expect(unreadCountBefore.unreadCount).toBeGreaterThan(0);

    // Mark single notification read
    const firstNotifId = list[0].id;
    await caller.user.markNotificationRead({ notificationId: firstNotifId });

    // Mark all notifications read
    await caller.user.markAllNotificationsRead();

    const unreadCountAfter = await caller.user.getUnreadNotificationCount();
    expect(unreadCountAfter.unreadCount).toBe(0);
  });
});
