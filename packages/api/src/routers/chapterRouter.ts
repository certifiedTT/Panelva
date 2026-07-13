import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Tier, SubscriptionTier, Role } from "@panelva/db";

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

      // Check access permission based on chapter tier
      const hasSubscription = user && (user.subscription === SubscriptionTier.PLUS || user.subscription === SubscriptionTier.PREMIUM);

      if (chapter.tier === Tier.PREMIUM) {
        // Tier 3: Locked for subscribers (Plus and Premium)
        if (!hasSubscription && user?.role !== Role.ADMIN && user?.role !== Role.MASTER_ADMIN && user?.role !== Role.CREATOR) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This chapter requires a Panelva Plus or Premium subscription",
          });
        }
      }

      // Compute visible countdown details
      let countdownSeconds = null;
      if (chapter.waitTierDropAt && chapter.waitTierDropAt > new Date()) {
        countdownSeconds = Math.floor((chapter.waitTierDropAt.getTime() - Date.now()) / 1000);
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
        nextTier: chapter.tier === Tier.PREMIUM ? Tier.AD_SUPPORTED : chapter.tier === Tier.AD_SUPPORTED ? Tier.FREE : null,
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
        // Record read history entry
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

        // ONLY increment creator/series analytics if user is NOT on promo subscription
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

      // Compute priority score hierarchy
      let priorityScore = 0; // default (normal user)

      if (user.role === Role.ADMIN || user.role === Role.MASTER_ADMIN) {
        priorityScore = 4;
      } else if (
        chapter.series.creator.userId === user.id ||
        chapter.series.collaborators.some(c => c.userId === user.id)
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
});
