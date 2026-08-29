import { z } from "zod";
import { router, publicProcedure, protectedProcedure, creatorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { ChapterTier, SubscriptionTier, UserRole, LedgerType } from "@panelva/db";
import { createLedgerEntry, getUserBalance } from "../ledger";
import { checkEarlyAccessPermission, getEarlyAccessSchedule } from "../earlyAccess";

export const chapterRouter = router({
  // 1. Fetch Chapter contents & countdown timer metrics
  getChapter: publicProcedure
    .input(z.object({ chapterId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const chapter = await ctx.prisma.chapter.findUnique({
        where: { id: input.chapterId },
        include: { 
          series: {
            include: { collaborators: true }
          },
          pages: true
        },
      });

      if (!chapter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });
      }

      const userSession = ctx.session;
      let user = null;
      if (userSession) {
        user = await ctx.prisma.user.findUnique({ where: { id: userSession.userId } });
      }

      // Check Early Access System first (Server-side early access authorization)
      const isCreatorOrCollab = !!(
        user &&
        (chapter.series.creatorId === user.id ||
         chapter.series.collaborators?.some((c: any) => c.userId === user.id))
      );

      const earlyAccessResult = checkEarlyAccessPermission(
        chapter.createdAt,
        user?.subscription,
        user?.role,
        isCreatorOrCollab
      );

      if (!earlyAccessResult.hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: earlyAccessResult.message || "This content is currently in early access for subscribers.",
        });
      }

      // Check access permission based on chapter tier (Content Access Type)
      const hasSubscription = user && (user.subscription === SubscriptionTier.PLUS || user.subscription === SubscriptionTier.PREMIUM);

      // Check custom tier membership subscription eligibility
      let isMember = false;
      if (user) {
        const sub = await ctx.prisma.userMembershipSubscription.findFirst({
          where: {
            userId: user.id,
            status: "ACTIVE",
            tier: { creatorProfileId: chapter.series.creatorId }
          }
        });
        if (sub) isMember = true;
      }

      if (chapter.tier === "PREMIUM") {
        if (!hasSubscription && !isMember && user?.role !== UserRole.ADMIN && user?.role !== UserRole.MASTER_ADMIN && user?.role !== UserRole.CREATOR) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This chapter requires a Panelva Plus/Premium subscription, or a Creator Membership.",
          });
        }
      }

      // Compute visible countdown details
      let countdownSeconds = null;
      let isPaused = chapter.series.isProgressionPaused;
      
      if (!isPaused && chapter.waitTierDropAt && chapter.waitTierDropAt > new Date()) {
        countdownSeconds = Math.floor((chapter.waitTierDropAt.getTime() - Date.now()) / 1000);
      } else if (isPaused && chapter.waitTierDropAt && chapter.series.progressionPausedAt) {
        // If paused, freeze the timer countdown remaining time
        const pausedDuration = chapter.series.progressionPausedAt.getTime() - Date.now(); // remaining frozen
        countdownSeconds = Math.max(0, Math.floor((chapter.waitTierDropAt.getTime() - chapter.series.progressionPausedAt.getTime()) / 1000));
      }

      return {
        id: chapter.id,
        title: chapter.title,
        chapterIndex: chapter.chapterIndex,
        tier: chapter.tier,
        textContent: chapter.textContent,
        pages: chapter.pages,
        seriesId: chapter.seriesId,
        countdownSeconds,
        isPaused,
        isEarlyAccess: earlyAccessResult.isEarlyAccessActive,
        earlyAccess: earlyAccessResult.schedule,
        nextTier: chapter.tier === "PREMIUM" ? "AD_SUPPORTED" : chapter.tier === "AD_SUPPORTED" ? "FREE" : null,
      };
    }),

  // 2. Increment view count protecting creator earnings from promo users
  incrementView: protectedProcedure
    .input(z.object({ chapterId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId }
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User profile not active" });
      }

      const chapter = await ctx.prisma.chapter.findUnique({
        where: { id: input.chapterId },
        include: { series: true }
      });
      if (!chapter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });
      }

      return await ctx.prisma.$transaction(async (tx) => {
        await tx.readingHistory.upsert({
          where: {
            userId_chapterId: {
              userId: user.id,
              chapterId: chapter.id
            }
          },
          update: { readAt: new Date() },
          create: {
            userId: user.id,
            chapterId: chapter.id
          }
        });

        if (!user.isPromotionalSubscription) {
          await tx.series.update({
            where: { id: chapter.seriesId },
            data: { views: { increment: 1 } }
          });

          await tx.creatorProfile.update({
            where: { id: chapter.series.creatorId },
            data: { viewCount: { increment: 1 } }
          });
        }

        return { success: true };
      });
    }),

  // 3. Post comment assigning dynamic priority score index
  postComment: protectedProcedure
    .input(
      z.object({
        chapterId: z.string().uuid(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId }
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User profile not active" });
      }

      const chapter = await ctx.prisma.chapter.findUnique({
        where: { id: input.chapterId },
        include: { 
          series: {
            include: { 
              collaborators: true,
              creator: true,
            }
          }
        }
      });
      if (!chapter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });
      }

      let priorityScore = 0; 

      if (user.role === UserRole.ADMIN || user.role === UserRole.MASTER_ADMIN) {
        priorityScore = 4;
      } else if (
        chapter.series.creator.userId === user.id ||
        chapter.series.collaborators.some((c: any) => c.userId === user.id)
      ) {
        priorityScore = 3;
      } else if (user.subscription === SubscriptionTier.PREMIUM) {
        priorityScore = 2;
      } else if (user.subscription === SubscriptionTier.PLUS) {
        priorityScore = 1;
      }

      return await ctx.prisma.comment.create({
        data: {
          chapterId: chapter.id,
          userId: user.id,
          content: input.content,
          priorityScore,
        },
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
              subscription: true,
              role: true
            }
          }
        }
      });
    }),

  // 4. Fetch sorted priority comments
  getComments: publicProcedure
    .input(
      z.object({
        chapterId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(20)
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        where: { chapterId: input.chapterId },
        take: input.limit,
        orderBy: [
          { priorityScore: "desc" },
          { createdAt: "desc" }
        ],
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
              subscription: true,
              role: true
            }
          }
        }
      });

      return comments;
    }),

  // 5. Unlock Chapter Transaction
  unlockChapter: protectedProcedure
    .input(
      z.object({
        chapterId: z.string().uuid(),
        idempotencyKey: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: ctx.session.userId },
        });
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const chapter = await tx.chapter.findUnique({
          where: { id: input.chapterId },
          include: { series: { include: { creator: true } } },
        });
        if (!chapter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });
        }

        const existingTx = await tx.coinLedger.findFirst({
          where: { transactionId: input.idempotencyKey },
        });
        if (existingTx) {
          return { success: true, message: "Chapter already unlocked (Idempotency Hit)" };
        }

        const unlockCost = 50; 

        if (user.wCoinBalance < unlockCost) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Insufficient Credits to unlock this chapter. Please recharge your wallet.",
          });
        }

        await createLedgerEntry(
          tx,
          user.id,
          chapter.series.creator.userId,
          unlockCost,
          LedgerType.UNLOCK,
          `Unlocked chapter ${chapter.title} (50 Credits)`,
          input.idempotencyKey
        );

        return { success: true };
      });
    }),

  // 6. Reader Workflow: Save Debounced Progress
  updateReadingProgress: protectedProcedure
    .input(
      z.object({
        chapterId: z.string().uuid(),
        scrollProgress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.readingHistory.upsert({
        where: {
          userId_chapterId: {
            userId: ctx.session.userId,
            chapterId: input.chapterId
          }
        },
        update: { 
          readAt: new Date(),
          progressPct: input.scrollProgress 
        },
        create: {
          userId: ctx.session.userId,
          chapterId: input.chapterId,
          progressPct: input.scrollProgress
        }
      });
    }),

  // Purchase Creator Membership
  purchaseMembership: protectedProcedure
    .input(
      z.object({
        tierId: z.string().uuid(),
        paymentMethod: z.enum(["DIRECT", "COINS"])
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: ctx.session.userId } });
        const tier = await tx.membershipTier.findUnique({ 
          where: { id: input.tierId },
          include: { creatorProfile: true }
        });

        if (!user || !tier) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User or membership tier not found" });
        }

        if (input.paymentMethod === "COINS") {
          const balance = user.wCoinBalance;
          if (balance < tier.priceCoins) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Insufficient Credits. Please recharge your wallet."
            });
          }

          // Transfer credits to creator
          await createLedgerEntry(
            tx,
            user.id,
            tier.creatorProfile.userId,
            tier.priceCoins,
            "GIFT_SENT",
            `Subscribed to membership tier: ${tier.name}`
          );
        } else {
          // Direct card payment: mock success
        }

        // Upsert subscription
        const sub = await tx.userMembershipSubscription.upsert({
          where: {
            userId_tierId: {
              userId: user.id,
              tierId: tier.id
            }
          },
          update: {
            status: "ACTIVE",
            paymentMethod: input.paymentMethod,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000)
          },
          create: {
            userId: user.id,
            tierId: tier.id,
            status: "ACTIVE",
            paymentMethod: input.paymentMethod,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000)
          }
        });

        // Notify Creator
        await tx.creatorNotification.create({
          data: {
            creatorProfileId: tier.creatorProfileId,
            title: "New Subscriber!",
            message: `@${user.username} subscribed to your '${tier.name}' membership tier!`,
            type: "SUBSCRIBER_NEW"
          }
        });

        // Update goal progress if there is a Member Goal
        await tx.creatorGoal.updateMany({
          where: {
            creatorProfileId: tier.creatorProfileId,
            type: "MEMBER"
          },
          data: {
            currentProgress: { increment: 1 }
          }
        });

        return sub;
      });
    }),

  // Get Release Simulator Timeline Preview
  getReleaseSimulatorTimeline: creatorProcedure
    .input(z.object({ newChapterCount: z.number().int().min(1).default(12) }))
    .query(async ({ ctx, input }) => {
      const N = input.newChapterCount;
      const timeline = [];

      // Calculate initial distribution
      let initialDistribution = {
        free: [] as number[],
        watch: [] as number[],
        premium: [] as number[]
      };

      if (N === 1) {
        initialDistribution.watch = [1];
      } else if (N === 2) {
        initialDistribution.watch = [1];
        initialDistribution.premium = [2];
      } else if (N === 3) {
        initialDistribution.free = [1];
        initialDistribution.watch = [2];
        initialDistribution.premium = [3];
      } else {
        const X = Math.floor(N / 3);
        for (let i = 1; i <= N; i++) {
          if (i <= X) initialDistribution.free.push(i);
          else if (i <= 2 * X) initialDistribution.watch.push(i);
          else initialDistribution.premium.push(i);
        }
      }

      // Today
      timeline.push({
        dayOffset: 0,
        title: "Today (Launch)",
        description: "Initial chapters uploaded and catalog distributed.",
        free: [...initialDistribution.free],
        watch: [...initialDistribution.watch],
        premium: [...initialDistribution.premium]
      });

      // Staggered transitions
      // Every premium chapter converts:
      // Ch P1 -> Watch in 7 days, Free in 14 days
      // Ch P2 -> Watch in 14 days, Free in 21 days
      // and so on.
      const premiumChapters = [...initialDistribution.premium];
      
      for (let week = 1; week <= premiumChapters.length + 2; week++) {
        const days = week * 7;
        
        // Compute state at this offset
        const free = [...initialDistribution.free];
        const watch = [...initialDistribution.watch];
        const premium = [] as number[];

        for (let idx = 0; idx < premiumChapters.length; idx++) {
          const chNum = premiumChapters[idx];
          const premiumOffsetWeeks = idx + 1; // 1st premium chapter offset is 1 week, etc.

          if (week >= premiumOffsetWeeks + 1) {
            // Converted to Free
            free.push(chNum);
          } else if (week >= premiumOffsetWeeks) {
            // Converted to Watch to Unlock
            watch.push(chNum);
          } else {
            premium.push(chNum);
          }
        }

        // Sort arrays
        free.sort((a, b) => a - b);
        watch.sort((a, b) => a - b);
        premium.sort((a, b) => a - b);

        // Find active changes at this week
        const changes = [];
        for (let idx = 0; idx < premiumChapters.length; idx++) {
          const chNum = premiumChapters[idx];
          const premiumOffsetWeeks = idx + 1;
          if (week === premiumOffsetWeeks) {
            changes.push(`Chapter ${chNum} → Watch to Unlock`);
          } else if (week === premiumOffsetWeeks + 1) {
            changes.push(`Chapter ${chNum} → Free`);
          }
        }

        if (changes.length > 0) {
          timeline.push({
            dayOffset: days,
            title: `${days} Days Later`,
            description: changes.join(" | "),
            free,
            watch,
            premium
          });
        }
      }

      return timeline;
    }),

  toggleBookmark: protectedProcedure
    .input(z.object({ seriesId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const { seriesId } = input;
      
      const existing = await ctx.prisma.bookmark.findUnique({
        where: { userId_seriesId: { userId, seriesId } },
      });
      
      if (existing) {
        await ctx.prisma.bookmark.delete({
          where: { id: existing.id },
        });
        return { bookmarked: false };
      } else {
        await ctx.prisma.bookmark.create({
          data: { userId, seriesId },
        });
        return { bookmarked: true };
      }
    }),

  toggleLike: protectedProcedure
    .input(z.object({ chapterId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const { chapterId } = input;
      
      const existing = await ctx.prisma.like.findUnique({
        where: { userId_chapterId: { userId, chapterId } },
      });
      
      if (existing) {
        await ctx.prisma.like.delete({
          where: { id: existing.id },
        });
        return { liked: false };
      } else {
        await ctx.prisma.like.create({
          data: { userId, chapterId },
        });
        return { liked: true };
      }
    }),

  getCommunityComments: publicProcedure
    .query(async ({ ctx }) => {
      let communityChapter = await ctx.prisma.chapter.findFirst({
        where: { title: "Global Board" }
      });
      
      if (!communityChapter) {
        let systemUser = await ctx.prisma.user.findFirst({
          where: { username: "system" }
        });
        if (!systemUser) {
          systemUser = await ctx.prisma.user.create({
            data: {
              username: "system",
              email: "system@panelva.com",
              role: "MASTER_ADMIN",
            }
          });
        }

        let systemCreator = await ctx.prisma.creatorProfile.findFirst({
          where: { userId: systemUser.id }
        });
        if (!systemCreator) {
          systemCreator = await ctx.prisma.creatorProfile.create({
            data: {
              userId: systemUser.id,
              type: "WRITER",
              penName: "System",
              portfolioUrl: "https://panelva.com",
              isVetted: true,
            }
          });
        }

        let communitySeries = await ctx.prisma.series.findFirst({
          where: { title: "System Community" }
        });
        if (!communitySeries) {
          communitySeries = await ctx.prisma.series.create({
            data: {
              title: "System Community",
              description: "System series for community boards",
              type: "COMIC",
              status: "COMPLETED",
              creatorId: systemCreator.id,
              coverUrl: "https://panelva.com/cover.jpg",
            }
          });
        }
        communityChapter = await ctx.prisma.chapter.create({
          data: {
            seriesId: communitySeries.id,
            title: "Global Board",
            chapterIndex: 1,
            tier: "FREE",
          }
        });
      }
      
      const comments = await ctx.prisma.comment.findMany({
        where: { chapterId: communityChapter.id },
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return comments.map(c => ({
        id: c.id,
        user: `@${c.user.username}`,
        role: c.user.role as any,
        priority: c.priorityScore,
        text: c.content,
        timestamp: c.createdAt.toLocaleString(),
      }));
    }),

  postCommunityComment: protectedProcedure
    .input(z.object({ content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      let communityChapter = await ctx.prisma.chapter.findFirst({
        where: { title: "Global Board" }
      });
      
      if (!communityChapter) {
        let systemUser = await ctx.prisma.user.findFirst({
          where: { username: "system" }
        });
        if (!systemUser) {
          systemUser = await ctx.prisma.user.create({
            data: {
              username: "system",
              email: "system@panelva.com",
              role: "MASTER_ADMIN",
            }
          });
        }

        let systemCreator = await ctx.prisma.creatorProfile.findFirst({
          where: { userId: systemUser.id }
        });
        if (!systemCreator) {
          systemCreator = await ctx.prisma.creatorProfile.create({
            data: {
              userId: systemUser.id,
              type: "WRITER",
              penName: "System",
              portfolioUrl: "https://panelva.com",
              isVetted: true,
            }
          });
        }

        let communitySeries = await ctx.prisma.series.findFirst({
          where: { title: "System Community" }
        });
        if (!communitySeries) {
          communitySeries = await ctx.prisma.series.create({
            data: {
              title: "System Community",
              description: "System series for community boards",
              type: "COMIC",
              status: "COMPLETED",
              creatorId: systemCreator.id,
              coverUrl: "https://panelva.com/cover.jpg",
            }
          });
        }
        communityChapter = await ctx.prisma.chapter.create({
          data: {
            seriesId: communitySeries.id,
            title: "Global Board",
            chapterIndex: 1,
            tier: "FREE",
          }
        });
      }

      const role = ctx.session.role;
      let priorityScore = 0;
      if (role === "MASTER_ADMIN" || (role as string).includes("ADMIN")) priorityScore = 4;
      else if (role === "CREATOR") priorityScore = 3;
      
      return await ctx.prisma.comment.create({
        data: {
          chapterId: communityChapter.id,
          userId: ctx.session.userId,
          content: input.content,
          priorityScore,
        }
      });
    }),

  getTrendingCountdowns: publicProcedure
    .query(async ({ ctx }) => {
      const now = new Date();
      const chapters = await ctx.prisma.chapter.findMany({
        where: {
          waitTierDropAt: {
            gt: now,
          }
        },
        include: {
          series: true,
        },
        orderBy: { waitTierDropAt: "asc" },
        take: 10,
      });

      return chapters.map(c => {
        const secondsRemaining = Math.max(0, Math.floor((c.waitTierDropAt!.getTime() - Date.now()) / 1000));
        return {
          id: c.id,
          title: c.series.title,
          chapter: `Chapter ${c.chapterIndex}`,
          fromTier: c.tier === "PREMIUM" ? "Premium (Tier 3)" : "Ad-supported (Tier 2)",
          toTier: c.tier === "PREMIUM" ? "Ad-supported (Tier 2)" : "Free (Tier 1)",
          secondsRemaining,
        };
      });
    }),
});
