import { prisma, UserRole, SeriesStatus } from "@panelva/db";

export const AdminNotificationService = {
  async send({
    role,
    title,
    message,
    priority = "Medium",
    category = "System",
    deepLink,
  }: {
    role: UserRole;
    title: string;
    message: string;
    priority?: "Low" | "Medium" | "High" | "Critical";
    category?: string;
    deepLink?: string;
  }) {
    try {
      return await prisma.adminNotification.create({
        data: {
          role,
          title,
          message,
          priority,
          category,
          deepLink,
        },
      });
    } catch (error) {
      console.error("Failed to create admin notification:", error);
    }
  },
};

export const FollowerNotificationService = {
  /**
   * 1. Notify followers when a creator publishes a brand new series.
   * Target: Followers of Creator
   */
  async notifyNewSeries({
    creatorProfileId,
    seriesId,
    seriesTitle,
    creatorName,
    senderUserId,
  }: {
    creatorProfileId: string;
    seriesId: string;
    seriesTitle: string;
    creatorName: string;
    senderUserId?: string;
  }) {
    try {
      // Find all followers of the creator
      const creatorFollowers = await prisma.creatorFollow.findMany({
        where: { creatorProfileId },
        select: { userId: true },
      });

      const recipientIds = new Set<string>();
      for (const f of creatorFollowers) {
        if (f.userId && f.userId !== senderUserId) {
          recipientIds.add(f.userId);
        }
      }

      if (recipientIds.size === 0) return { count: 0 };

      const title = `New series from ${creatorName}`;
      const body = `*${seriesTitle}* has just been published. Start reading now.`;
      const type = "new_series";

      const notificationsData = Array.from(recipientIds).map((userId) => ({
        userId,
        creatorId: creatorProfileId,
        seriesId,
        type,
        title,
        body,
        read: false,
      }));

      await prisma.notification.createMany({
        data: notificationsData,
      });

      return { count: recipientIds.size };
    } catch (error) {
      console.error("Failed to dispatch new series notifications:", error);
      return { count: 0, error };
    }
  },

  /**
   * 2. Notify followers when a new chapter is published.
   * Target: Followers of Series AND Followers of Creator (Deduplicated)
   */
  async notifyNewChapter({
    seriesId,
    chapterIndex,
    seriesTitle,
    creatorProfileId,
    senderUserId,
  }: {
    seriesId: string;
    chapterIndex: number;
    seriesTitle: string;
    creatorProfileId?: string;
    senderUserId?: string;
  }) {
    try {
      // Find followers of the series
      const seriesFollowers = await prisma.follow.findMany({
        where: { seriesId },
        select: { userId: true },
      });

      // Find followers of the creator (if creatorProfileId provided)
      let creatorFollowers: { userId: string }[] = [];
      if (creatorProfileId) {
        creatorFollowers = await prisma.creatorFollow.findMany({
          where: { creatorProfileId },
          select: { userId: true },
        });
      }

      // Deduplicate user IDs using Set
      const recipientIds = new Set<string>();
      for (const f of seriesFollowers) {
        if (f.userId && f.userId !== senderUserId) {
          recipientIds.add(f.userId);
        }
      }
      for (const cf of creatorFollowers) {
        if (cf.userId && cf.userId !== senderUserId) {
          recipientIds.add(cf.userId);
        }
      }

      if (recipientIds.size === 0) return { count: 0 };

      const title = `New chapter available`;
      const body = `Chapter ${chapterIndex} of *${seriesTitle}* is now available.`;
      const type = "new_chapter";

      const notificationsData = Array.from(recipientIds).map((userId) => ({
        userId,
        creatorId: creatorProfileId || null,
        seriesId,
        type,
        title,
        body,
        read: false,
      }));

      await prisma.notification.createMany({
        data: notificationsData,
      });

      return { count: recipientIds.size };
    } catch (error) {
      console.error("Failed to dispatch new chapter notifications:", error);
      return { count: 0, error };
    }
  },

  /**
   * 3. Notify followers when series status changes.
   * Target: Followers of Series AND Followers of Creator (Deduplicated)
   */
  async notifyStatusChange({
    seriesId,
    seriesTitle,
    status,
    statusMessage,
    seasonNumber,
    creatorProfileId,
    senderUserId,
  }: {
    seriesId: string;
    seriesTitle: string;
    status: SeriesStatus | string;
    statusMessage?: string | null;
    seasonNumber?: number;
    creatorProfileId?: string;
    senderUserId?: string;
  }) {
    try {
      // Find followers of the series
      const seriesFollowers = await prisma.follow.findMany({
        where: { seriesId },
        select: { userId: true },
      });

      // Find followers of the creator
      let creatorFollowers: { userId: string }[] = [];
      if (creatorProfileId) {
        creatorFollowers = await prisma.creatorFollow.findMany({
          where: { creatorProfileId },
          select: { userId: true },
        });
      }

      // Deduplicate user IDs using Set
      const recipientIds = new Set<string>();
      for (const f of seriesFollowers) {
        if (f.userId && f.userId !== senderUserId) {
          recipientIds.add(f.userId);
        }
      }
      for (const cf of creatorFollowers) {
        if (cf.userId && cf.userId !== senderUserId) {
          recipientIds.add(cf.userId);
        }
      }

      if (recipientIds.size === 0) return { count: 0 };

      // Map status to exact required titles and bodies
      let title = `Status updated for ${seriesTitle}`;
      let body = `*${seriesTitle}* status has been updated.`;

      const normalizedStatus = String(status).toUpperCase();

      switch (normalizedStatus) {
        case "HIATUS":
          title = `Series is on hiatus`;
          body = `*${seriesTitle}* is taking a short break. You'll be notified when it returns.`;
          break;

        case "SEASON_ENDED":
          title = `Season completed`;
          body = `Season ${seasonNumber || 1} of *${seriesTitle}* has officially ended.`;
          break;

        case "NEW_SEASON_COMING":
          title = `A new season is coming`;
          body = `*${seriesTitle}* will return with a new season soon.`;
          break;

        case "COMING_SOON":
          title = `Coming Soon`;
          body = `*${seriesTitle}* has been announced. Follow the series to receive updates.`;
          break;

        case "ONGOING":
          title = `Series returned to Ongoing`;
          body = `*${seriesTitle}* status updated to Ongoing. New chapters coming regularly.`;
          break;

        default:
          title = `Status update for ${seriesTitle}`;
          body = `*${seriesTitle}* status has been updated to ${status}.`;
          break;
      }

      // If creator provided custom announcement message, append it
      if (statusMessage && statusMessage.trim().length > 0) {
        body = `${body}\n\nCreator note: ${statusMessage.trim()}`;
      }

      const type = "series_status";

      const notificationsData = Array.from(recipientIds).map((userId) => ({
        userId,
        creatorId: creatorProfileId || null,
        seriesId,
        type,
        title,
        body,
        read: false,
      }));

      await prisma.notification.createMany({
        data: notificationsData,
      });

      return { count: recipientIds.size };
    } catch (error) {
      console.error("Failed to dispatch series status change notifications:", error);
      return { count: 0, error };
    }
  },
};

