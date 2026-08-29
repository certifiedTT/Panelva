import { prisma, UserRole, SeriesStatus } from "@panelva/db";
import { FollowerNotificationService } from "./notificationService";
import { appRouter } from "../routers";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log("--- Running FollowerNotificationService Tests ---");
  const suffix = Date.now();

  let creatorUser: any;
  let creatorProfile: any;
  let followerOfCreator: any;
  let followerOfSeries: any;
  let followerOfBoth: any;
  let series: any;

  try {
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

    // --- TEST 1: New Series Notification ---
    console.log("\n[Test 1] notifyNewSeries");
    const resNewSeries = await FollowerNotificationService.notifyNewSeries({
      creatorProfileId: creatorProfile.id,
      seriesId: series.id,
      seriesTitle: series.title,
      creatorName: creatorProfile.penName,
      senderUserId: creatorUser.id,
    });

    assert(resNewSeries.count === 2, "notifyNewSeries delivered to 2 creator followers");
    const notifsNewSeries = await prisma.notification.findMany({
      where: { seriesId: series.id, type: "new_series" },
    });
    assert(notifsNewSeries.length === 2, "2 new_series notifications in DB");
    assert(notifsNewSeries[0].title === `New series from ${creatorProfile.penName}`, "Correct new series title format");
    assert(notifsNewSeries[0].body === `*${series.title}* has just been published. Start reading now.`, "Correct new series body format");
    const newSeriesUserIds = notifsNewSeries.map((n) => n.userId);
    assert(newSeriesUserIds.includes(followerOfCreator.id), "Follower of creator received notification");
    assert(newSeriesUserIds.includes(followerOfBoth.id), "Follower of both received notification");
    assert(!newSeriesUserIds.includes(followerOfSeries.id), "Series-only follower did not receive new series notification");

    // --- TEST 2: New Chapter Notification with Deduplication ---
    console.log("\n[Test 2] notifyNewChapter Deduplication");
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });

    const resChapter = await FollowerNotificationService.notifyNewChapter({
      seriesId: series.id,
      chapterIndex: 7,
      seriesTitle: series.title,
      creatorProfileId: creatorProfile.id,
      senderUserId: creatorUser.id,
    });

    assert(resChapter.count === 3, "notifyNewChapter delivered to 3 unique users (deduplicated)");
    const notifsChapter = await prisma.notification.findMany({
      where: { seriesId: series.id, type: "new_chapter" },
    });
    assert(notifsChapter.length === 3, "Exactly 3 new_chapter notifications in DB");
    assert(notifsChapter[0].title === "New chapter available", "Correct new chapter title format");
    assert(notifsChapter[0].body === `Chapter 7 of *${series.title}* is now available.`, "Correct new chapter body format");

    const bothChapterNotifs = notifsChapter.filter((n) => n.userId === followerOfBoth.id);
    assert(bothChapterNotifs.length === 1, "Follower of both received EXACTLY 1 notification (no duplicates)");

    // --- TEST 3: All 5 Series Status Changes ---
    console.log("\n[Test 3] Series Status Notifications");

    // 3A: HIATUS
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.HIATUS,
      creatorProfileId: creatorProfile.id,
    });
    let statusNotifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    assert(statusNotifs[0].title === "Series is on hiatus", "HIATUS title is exact");
    assert(statusNotifs[0].body === `*${series.title}* is taking a short break. You'll be notified when it returns.`, "HIATUS body is exact");

    // 3B: SEASON_ENDED
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.SEASON_ENDED,
      seasonNumber: 1,
      creatorProfileId: creatorProfile.id,
    });
    statusNotifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    assert(statusNotifs[0].title === "Season completed", "SEASON_ENDED title is exact");
    assert(statusNotifs[0].body === `Season 1 of *${series.title}* has officially ended.`, "SEASON_ENDED body is exact");

    // 3C: NEW_SEASON_COMING
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.NEW_SEASON_COMING,
      creatorProfileId: creatorProfile.id,
    });
    statusNotifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    assert(statusNotifs[0].title === "A new season is coming", "NEW_SEASON_COMING title is exact");
    assert(statusNotifs[0].body === `*${series.title}* will return with a new season soon.`, "NEW_SEASON_COMING body is exact");

    // 3D: COMING_SOON
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.COMING_SOON,
      creatorProfileId: creatorProfile.id,
    });
    statusNotifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    assert(statusNotifs[0].title === "Coming Soon", "COMING_SOON title is exact");
    assert(statusNotifs[0].body === `*${series.title}* has been announced. Follow the series to receive updates.`, "COMING_SOON body is exact");

    // 3E: ONGOING with message
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });
    await FollowerNotificationService.notifyStatusChange({
      seriesId: series.id,
      seriesTitle: series.title,
      status: SeriesStatus.ONGOING,
      statusMessage: "Chapter 50 arrives this Friday!",
      creatorProfileId: creatorProfile.id,
    });
    statusNotifs = await prisma.notification.findMany({ where: { seriesId: series.id, type: "series_status" } });
    assert(statusNotifs[0].title === "Series returned to Ongoing", "ONGOING title is exact");
    assert(statusNotifs[0].body.includes("Chapter 50 arrives this Friday!"), "Status message appended to body");

    // --- TEST 4: series.updateStatus tRPC Mutation ---
    console.log("\n[Test 4] series.updateStatus Mutation");
    await prisma.notification.deleteMany({ where: { seriesId: series.id } });

    const creatorCaller = appRouter.createCaller({
      prisma,
      session: {
        userId: creatorUser.id,
        email: creatorUser.email,
        role: UserRole.CREATOR,
      },
    } as any);

    const updated = await creatorCaller.series.updateStatus({
      seriesId: series.id,
      status: SeriesStatus.HIATUS,
      statusMessage: "Author hiatus announcement",
    });

    assert(updated.status === SeriesStatus.HIATUS, "series.updateStatus updated DB status to HIATUS");
    assert(updated.statusMessage === "Author hiatus announcement", "series.updateStatus updated DB statusMessage");

    const deliveredNotifs = await prisma.notification.findMany({ where: { seriesId: series.id } });
    assert(deliveredNotifs.length === 3, "series.updateStatus broadcasted 3 deduplicated notifications");

    // --- TEST 5: user router reader notification endpoints ---
    console.log("\n[Test 5] user router reader notification endpoints");
    const readerCaller = appRouter.createCaller({
      prisma,
      session: {
        userId: followerOfBoth.id,
        email: followerOfBoth.email,
        role: UserRole.USER,
      },
    } as any);

    const notificationsList = await readerCaller.user.getReaderNotifications();
    assert(notificationsList.length > 0, "getReaderNotifications returned notification items");
    assert(notificationsList[0].body !== undefined, "notification item has body");
    assert(notificationsList[0].title !== undefined, "notification item has title");

    const unreadCountObj = await readerCaller.user.getUnreadNotificationCount();
    assert(unreadCountObj.unreadCount > 0, "getUnreadNotificationCount returned > 0");

    await readerCaller.user.markNotificationRead({ notificationId: notificationsList[0].id });
    await readerCaller.user.markAllNotificationsRead();

    const unreadCountAfter = await readerCaller.user.getUnreadNotificationCount();
    assert(unreadCountAfter.unreadCount === 0, "markAllNotificationsRead set unreadCount to 0");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    // Cleanup
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
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
