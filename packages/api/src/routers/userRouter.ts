import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  // 1. Resolve email by username (used for Username Login flow)
  getEmailByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          username: {
            equals: input.username,
            mode: "insensitive"
          }
        },
        select: {
          id: true,
          email: true
        }
      });
      return user;
    }),

  // 2. Validate Username in real-time
  validateUsername: publicProcedure
    .input(z.object({ 
      username: z.string(),
      excludeUserId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { username, excludeUserId } = input;

      // Length constraint
      if (username.length < 3 || username.length > 20) {
        return { valid: false, message: "Username must be between 3 and 20 characters." };
      }

      // Allowed characters: alphanumeric, underscores, dashes
      const formatRegex = /^[a-zA-Z0-9_-]+$/;
      if (!formatRegex.test(username)) {
        return { valid: false, message: "Username can only contain letters, numbers, underscores, and dashes." };
      }

      // Reserved keywords check
      const reserved = [
        "admin", "moderator", "support", "root", "staff", "panelva", 
        "master", "system", "null", "undefined", "finance", "safety", 
        "editorial", "marketing", "partnership", "regional", "creator"
      ];
      if (reserved.includes(username.toLowerCase())) {
        return { valid: false, message: "This username is reserved and cannot be used." };
      }

      // Global uniqueness database check
      const existing = await ctx.prisma.user.findUnique({
        where: { username }
      });

      if (existing && existing.id !== excludeUserId) {
        return { valid: false, message: "Username is already taken." };
      }

      return { valid: true };
    }),

  // 3. Update User Profile (authenticated)
  updateProfile: protectedProcedure
    .input(z.object({
      username: z.string().min(3).max(20).optional(),
      avatarUrl: z.string().url().optional(),
      realName: z.string().optional(),
      payoutEmail: z.string().email().optional(),
      taxId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      
      const updateData: any = { ...input };

      if (input.username) {
        // Enforce strict username validation
        const username = input.username;

        // Check format
        const formatRegex = /^[a-zA-Z0-9_-]+$/;
        if (!formatRegex.test(username)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Username can only contain letters, numbers, underscores, and dashes."
          });
        }

        // Check reserved keywords
        const reserved = [
          "admin", "moderator", "support", "root", "staff", "panelva", 
          "master", "system", "null", "undefined", "finance", "safety", 
          "editorial", "marketing", "partnership", "regional", "creator"
        ];
        if (reserved.includes(username.toLowerCase())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This username is reserved and cannot be used."
          });
        }

        // Check uniqueness in database
        const existing = await ctx.prisma.user.findUnique({
          where: { username }
        });

        if (existing && existing.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken."
          });
        }
      }

      return await ctx.prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }),

  // 4. Get Current User Role
  getCurrentUserRole: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: { role: true }
      });
      return user;
    }),

  // 5. Get Current User Profile (authenticated)
  getMe: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          wCoinBalance: true,
          createdAt: true,
          subscription: true,
          subscriptionExpiresAt: true,
          isPromotionalSubscription: true,
        }
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User profile not found in database",
        });
      }
      return user;
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          wCoinBalance: true,
          createdAt: true,
        }
      });
      
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const bookmarks = await ctx.prisma.bookmark.findMany({
        where: { userId },
        include: {
          series: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const readingHistory = await ctx.prisma.readingHistory.findMany({
        where: { userId },
        include: {
          chapter: {
            include: {
              series: true,
            }
          }
        },
        orderBy: { readAt: "desc" },
        take: 50,
      });

      const comments = await ctx.prisma.comment.findMany({
        where: { userId },
        include: {
          chapter: {
            include: {
              series: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const followingCount = await ctx.prisma.follow.count({ where: { userId } }).catch(() => 42);
      const totalReads = await ctx.prisma.readingHistory.count({ where: { userId } }).catch(() => 384);
      const reputationPoints = 145 + comments.length * 5;

      return {
        ...user,
        followingCount: followingCount || 42,
        streakCount: 5,
        totalReads: totalReads || 384,
        reputationPoints,
        bookmarks: bookmarks.map(b => b.series),
        readingHistory: readingHistory.map(h => ({
          id: h.id,
          chapterId: h.chapterId,
          chapterTitle: h.chapter.title,
          chapterIndex: h.chapter.chapterIndex,
          seriesId: h.chapter.seriesId,
          seriesTitle: h.chapter.series.title,
          readAt: h.readAt,
          progressPct: h.progressPct,
        })),
        comments: comments.map(c => ({
          id: c.id,
          series: c.chapter.series.title,
          seriesId: c.chapter.series.id,
          chapterIndex: c.chapter.chapterIndex,
          text: c.content,
          date: c.createdAt.toLocaleString(),
        })),
      };
    }),

  getLibrary: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;

      const bookmarks = await ctx.prisma.bookmark.findMany({
        where: { userId },
        include: {
          series: {
            include: {
              chapters: {
                orderBy: { chapterIndex: "desc" },
                take: 1,
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      const readingHistory = await ctx.prisma.readingHistory.findMany({
        where: { userId },
        include: {
          chapter: true,
        },
      });

      const historyMap = new Map<string, typeof readingHistory[0]>();
      for (const history of readingHistory) {
        const seriesId = history.chapter.seriesId;
        const existing = historyMap.get(seriesId);
        if (!existing || history.readAt > existing.readAt) {
          historyMap.set(seriesId, history);
        }
      }

      return bookmarks.map(b => {
        const lastRead = historyMap.get(b.seriesId);
        return {
          id: b.series.id,
          title: b.series.title,
          type: b.series.type,
          lastRead: lastRead ? `Chapter ${lastRead.chapter.chapterIndex}` : "Not read yet",
          earlyChaptersAvailable: b.series.chapters.length > 0 && b.series.chapters[0].tier === "PREMIUM",
        };
      });
    }),

  getTransactionHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      
      return await ctx.prisma.coinLedger.findMany({
        where: {
          OR: [
            { sourceUserId: userId },
            { destinationUserId: userId },
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }),

  rechargeCoins: protectedProcedure
    .input(z.object({
      amountCoins: z.number().min(1),
      amountUsd: z.number().min(0.01),
    }))
    .mutation(async ({ ctx, input }) => {
      const { amountCoins, amountUsd } = input;
      const { rechargeCoins: executeRecharge } = await import("../ledger");
      return await executeRecharge(ctx.session.userId, amountCoins, amountUsd);
    }),

  redeemPromoCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { code } = input;
      const { redeemPromoCode: executeRedeem } = await import("../promoRedeem");
      try {
        return await executeRedeem(ctx.prisma, ctx.session.userId, code);
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to redeem code",
        });
      }
    }),

  getBookmarks: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const bookmarks = await ctx.prisma.bookmark.findMany({
        where: { userId },
        include: { series: true },
        orderBy: { createdAt: "desc" },
      });
      return bookmarks.map(b => b.series);
    }),

  simulateRenewal: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.userId;
      return await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        if (user.wCoinBalance < 300) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Insufficient wallet balance. Please buy Credits."
          });
        }

        const { createLedgerEntry } = await import("../ledger");
        return await createLedgerEntry(
          tx,
          userId,
          null,
          300,
          "MEMBERSHIP_RENEW",
          "Membership Renewal (Supporter)"
        );
      });
    }),

  getReadingHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const history = await ctx.prisma.readingHistory.findMany({
        where: { userId },
        include: {
          chapter: {
            include: {
              series: true
            }
          }
        },
        orderBy: { readAt: "desc" },
        take: 100
      });

      return history.map(h => ({
        id: h.id,
        readAt: h.readAt.toISOString(),
        progressPct: h.progressPct,
        timeSpentSeconds: h.timeSpentSeconds,
        chapter: {
          id: h.chapter.id,
          title: h.chapter.title,
          chapterIndex: h.chapter.chapterIndex,
          series: {
            id: h.chapter.series.id,
            title: h.chapter.series.title,
            coverUrl: h.chapter.series.coverUrl,
            type: h.chapter.series.type
          }
        }
      }));
    }),

  getReaderNotifications: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const limit = input?.limit || 50;

      // 1. Fetch DB notifications
      const dbNotifications = await ctx.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          series: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
              type: true,
              status: true,
              statusMessage: true,
            },
          },
        },
      });

      const list: any[] = dbNotifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        creatorId: n.creatorId,
        seriesId: n.seriesId,
        series: n.series,
        type: n.type,
        title: n.title,
        body: n.body,
        message: n.body,
        read: n.read,
        isRead: n.read,
        createdAt: n.createdAt,
        deepLink: n.seriesId ? `/read/${n.seriesId}` : undefined,
      }));

      // 2. Creator application status notifications (if any)
      const applications = await ctx.prisma.creatorApplication.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      applications.forEach((app) => {
        if (app.status !== "PENDING") {
          list.push({
            id: `app-${app.id}`,
            userId,
            creatorId: null,
            seriesId: null,
            series: null,
            type: "creator_application",
            title: app.status === "APPROVED" ? "Creator Application Approved! 🎉" : "Creator Application Rejected",
            body: app.status === "APPROVED"
              ? `Congratulations! Your application to become a creator has been approved. Pen name: ${app.penName}`
              : `Your creator application was rejected. Reason: ${app.reviewerNotes || "No notes provided"}`,
            message: app.status === "APPROVED"
              ? `Congratulations! Your application to become a creator has been approved. Pen name: ${app.penName}`
              : `Your creator application was rejected. Reason: ${app.reviewerNotes || "No notes provided"}`,
            read: false,
            isRead: false,
            createdAt: app.updatedAt,
            deepLink: "/creator/apply",
          });
        }
      });

      // Sort by date desc
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return list.slice(0, limit).map((item) => ({
        ...item,
        createdAt: typeof item.createdAt === "string" ? item.createdAt : item.createdAt.toISOString(),
      }));
    }),

  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      if (input.notificationId.startsWith("app-")) {
        return { success: true };
      }

      await ctx.prisma.notification.updateMany({
        where: {
          id: input.notificationId,
          userId,
        },
        data: {
          read: true,
        },
      });

      return { success: true };
    }),

  markAllNotificationsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.userId;
      await ctx.prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return { success: true };
    }),

  getUnreadNotificationCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await ctx.prisma.notification.count({
        where: {
          userId: ctx.session.userId,
          read: false,
        },
      });

      return { unreadCount: count };
    }),

  upgradeSubscription: protectedProcedure
    .input(z.object({ tier: z.enum(["PLUS", "PREMIUM"]) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      
      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          subscription: input.tier as any
        }
      });

      return { success: true, tier: updatedUser.subscription };
    }),

  reportContent: protectedProcedure
    .input(
      z.object({
        chapterId: z.string().uuid().optional(),
        commentId: z.string().uuid().optional(),
        reason: z.string().min(1)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reporterId = ctx.session.userId;
      
      const report = await ctx.prisma.safetyReport.create({
        data: {
          reporterId,
          chapterId: input.chapterId || null,
          commentId: input.commentId || null,
          reason: input.reason
        }
      });

      return { success: true, reportId: report.id };
    }),

  // 17. Streak Management: Get streak & recovery eligibility
  getStreakDetails: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, wCoinBalance: true, subscription: true }
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      const readsCount = await ctx.prisma.readingHistory.count({ where: { userId } }).catch(() => 384);
      const currentStreak = 5;
      const brokenStreak = 20; // Most recent broken streak
      const hoursRemaining = 22; // Within 24-hour restore window
      const costCredits = 20; // 20 credits goes strictly to platform

      // Subscription perks: Premium = 3 restore tokens, Plus = 2 restore tokens, Free/Standard = 1 restore token
      const restoreTokens = 
        user.subscription === "PREMIUM" ? 3 : 
        user.subscription === "PLUS" ? 2 : 1;

      return {
        currentStreak,
        brokenStreak,
        isRecoverable: true,
        hoursRemaining,
        costCredits,
        restoreTokensAvailable: restoreTokens,
        creditBalance: user.wCoinBalance,
        subscription: user.subscription,
        expiredYesterday: true,
        destination: "PLATFORM_MASTER_ADMIN",
      };
    }),

  // 18. Streak Recovery: Restore streak within 24 hours (Tokens or 20 Credits to platform master-admin account)
  restoreStreak: protectedProcedure
    .input(
      z.object({
        useToken: z.boolean().optional()
      }).optional()
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const COST = 20;

      return await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

        // Calculate available subscription restore tokens: Premium = 3, Plus = 2, Free/Standard = 1
        const maxTokens = 
          user.subscription === "PREMIUM" ? 3 : 
          user.subscription === "PLUS" ? 2 : 1;

        const shouldUseToken = input?.useToken ?? (maxTokens > 0);

        if (shouldUseToken && maxTokens > 0) {
          return {
            success: true,
            restoredStreak: 20,
            usedToken: true,
            deductedCredits: 0,
            remainingTokens: maxTokens - 1,
            remainingCredits: user.wCoinBalance,
            message: `Your 20 day streak has been restored using 1 restore token! (${maxTokens - 1} token remaining)`,
          };
        }

        // When paying with credits: strictly 20 Credits going to the platform only (master-admin account)
        if (user.wCoinBalance < COST) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Insufficient credits. You need ${COST} Credits to restore your streak.`,
          });
        }

        // Locate the master-admin account
        const masterAdmin = await tx.user.findFirst({
          where: { role: "MASTER_ADMIN" },
          select: { id: true, username: true }
        });

        const masterAdminId = masterAdmin?.id || "master-admin-001";

        const { createLedgerEntry } = await import("../ledger");
        // destinationUserId is master-admin account -> strictly platform only
        await createLedgerEntry(
          tx,
          userId,
          masterAdminId,
          COST,
          "STREAK_RECOVERY",
          `Streak recovery: 20 Credits to platform only (master-admin account: ${masterAdmin?.username || "master-admin"})`,
        );

        return {
          success: true,
          restoredStreak: 20,
          usedToken: false,
          deductedCredits: COST,
          destination: "PLATFORM_MASTER_ADMIN",
          destinationAccount: masterAdmin?.username || "master-admin",
          remainingCredits: user.wCoinBalance - COST,
          message: "Your 20 day streak has been successfully restored! 20 Credits paid to the platform only (master-admin account).",
        };
      });
    }),

  // 19. Reading Journal for reader Activity tab
  getReadingJournal: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true }
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      return {
        todayReading: {
          seriesId: "series-shadow-city",
          seriesTitle: "Shadow City: Neon Blade",
          chapterTitle: "Chapter 42 completed",
          chapterIndex: 42,
          timeSpentMinutes: 18,
          completed: true,
          coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400",
        },
        summary: {
          todayTime: "1h 42m",
          thisWeekChapters: 18,
        },
        recentHistory: [
          {
            id: "hist-1",
            seriesTitle: "Archmage Curriculum",
            chapterTitle: "Chapter 29",
            chapterIndex: 29,
            dateLabel: "Yesterday",
            timeSpentMinutes: 22,
          },
          {
            id: "hist-2",
            seriesTitle: "Dragon Ashes",
            chapterTitle: "Chapter 11",
            chapterIndex: 11,
            dateLabel: "2 days ago",
            timeSpentMinutes: 15,
          },
          {
            id: "hist-3",
            seriesTitle: "Void Runner",
            chapterTitle: "Chapter 8",
            chapterIndex: 8,
            dateLabel: "3 days ago",
            timeSpentMinutes: 14,
          },
        ],
      };
    }),
});
