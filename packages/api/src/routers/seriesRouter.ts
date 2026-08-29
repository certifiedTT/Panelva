import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { SeriesType, SeriesStatus } from "@panelva/db";
import { TRPCError } from "@trpc/server";
import { getEarlyAccessSchedule } from "../earlyAccess";
import { FollowerNotificationService } from "../services/notificationService";

export const seriesRouter = router({
  // Fetch series owned by current creator
  getCreatorSeries: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.creatorProfile.findFirst({
      where: { userId: ctx.session.userId }
    });
    if (!profile) return [];
    return await ctx.prisma.series.findMany({
      where: { creatorId: profile.id },
      include: {
        collaborators: {
          include: {
            user: {
              include: {
                creatorProfiles: true,
              }
            }
          }
        },
        invitations: {
          include: {
            receiver: {
              include: {
                creatorProfiles: true,
              }
            }
          }
        }
      }
    });
  }),
  // 1. Fetch top trending series
  getTrending: publicProcedure
    .input(
      z.object({
        type: z.enum(["COMIC", "NOVEL"]).optional(),
        limit: z.number().min(1).max(50).default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.series.findMany({
        where: input.type ? { type: input.type } : undefined,
        orderBy: [
          { views: "desc" },
          { likes: "desc" },
        ],
        take: input.limit,
        include: {
          creator: true,
          chapters: {
            orderBy: { sortKey: "asc" },
          },
        },
      });
    }),

  // Search across all series (global search)
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.series.findMany({
        where: {
          OR: [
            { title: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        orderBy: { views: "desc" },
        take: input.limit,
        include: {
          creator: true,
        },
      });
    }),

  // 2. Fetch filtered explore pages listings
  getMany: publicProcedure
    .input(
      z.object({
        type: z.enum(["COMIC", "NOVEL"]).optional(),
        searchQuery: z.string().optional(),
        genre: z.string().optional(),
        status: z.nativeEnum(SeriesStatus).optional(),
        sortBy: z.enum(["Popularity", "Likes", "Newest", "Alphabetical"]).default("Popularity"),
        limit: z.number().min(1).max(100).default(24),
        skip: z.number().int().min(0).default(0).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let orderBy: any = { views: "desc" };
      if (input.sortBy === "Likes") {
        orderBy = { likes: "desc" };
      } else if (input.sortBy === "Newest") {
        orderBy = { createdAt: "desc" };
      } else if (input.sortBy === "Alphabetical") {
        orderBy = { title: "asc" };
      }

      const where: any = {};
      if (input.type) {
        where.type = input.type;
      }

      if (input.searchQuery) {
        where.title = {
          contains: input.searchQuery,
        };
      }

      if (input.genre && input.genre !== "All Genres") {
        where.genre = {
          equals: input.genre,
        };
      }

      if (input.status) {
        where.status = input.status;
      }

      return await ctx.prisma.series.findMany({
        where,
        orderBy,
        take: input.limit,
        skip: input.skip,
        include: {
          creator: true,
          chapters: {
            orderBy: { sortKey: "asc" },
          },
        },
      });
    }),

  // 3. Fetch full series detail by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const series = await ctx.prisma.series.findUnique({
        where: { id: input.id },
        include: {
          creator: true,
          chapters: {
            orderBy: { sortKey: "asc" },
          },
          collaborators: true,
        },
      });

      if (!series) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Series not found" });
      }

      // Fetch linked series if linkedSeriesId is configured
      let linkedSeries: any = null;
      if (series.linkedSeriesId) {
        linkedSeries = await ctx.prisma.series.findUnique({
          where: { id: series.linkedSeriesId },
          include: {
            creator: true,
            chapters: {
              orderBy: { sortKey: "asc" },
            },
          },
        });
      }

      // Compute early access schedule for the series and each chapter
      const seriesEarlyAccess = getEarlyAccessSchedule(series.createdAt);
      const chaptersWithEarlyAccess = series.chapters.map((ch) => {
        const chapterEarlyAccess = getEarlyAccessSchedule(ch.createdAt);
        return {
          ...ch,
          isEarlyAccess: chapterEarlyAccess.isEarlyAccessActive,
          earlyAccess: chapterEarlyAccess,
        };
      });

      return {
        ...series,
        isEarlyAccess: seriesEarlyAccess.isEarlyAccessActive,
        earlyAccess: seriesEarlyAccess,
        chapters: chaptersWithEarlyAccess,
        linkedSeries: linkedSeries ? {
          ...linkedSeries,
          isEarlyAccess: getEarlyAccessSchedule(linkedSeries.createdAt).isEarlyAccessActive,
          earlyAccess: getEarlyAccessSchedule(linkedSeries.createdAt),
          chapters: linkedSeries.chapters?.map((ch: any) => ({
            ...ch,
            isEarlyAccess: getEarlyAccessSchedule(ch.createdAt).isEarlyAccessActive,
            earlyAccess: getEarlyAccessSchedule(ch.createdAt),
          })) || [],
        } : null,
      };
    }),

  // Fetch only linked series details
  getLinkedSeries: publicProcedure
    .input(z.object({ seriesId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const series = await ctx.prisma.series.findUnique({
        where: { id: input.seriesId },
        select: { linkedSeriesId: true },
      });
      if (!series || !series.linkedSeriesId) return null;

      return await ctx.prisma.series.findUnique({
        where: { id: series.linkedSeriesId },
        include: {
          creator: true,
          chapters: {
            orderBy: { chapterIndex: "asc" },
          },
        },
      });
    }),

  // 4. Recommendation Engine (Users who read X also read Y)
  getRecommendations: publicProcedure
    .input(z.object({ 
      seriesId: z.string().uuid(),
      limit: z.number().min(1).max(20).default(6)
    }))
    .query(async ({ ctx, input }) => {
      // Find the base series to get its genre and type
      const baseSeries = await ctx.prisma.series.findUnique({
        where: { id: input.seriesId },
        select: { genre: true, type: true }
      });

      if (!baseSeries) return [];

      // For Phase 4, we query based on similar genre/type. 
      // In a scaled version, we would join ReadingHistory to find overlapping user reads.
      const recommendations = await ctx.prisma.series.findMany({
        where: {
          id: { not: input.seriesId }, // exclude current series
          genre: baseSeries.genre,
          type: baseSeries.type,
        },
        orderBy: { views: "desc" },
        take: input.limit,
        include: {
          creator: true,
          chapters: {
            orderBy: { chapterIndex: "asc" },
          },
        },
      });

      // If we don't have enough genre matches, pad with trending series of the same type
      if (recommendations.length < input.limit) {
        const extra = await ctx.prisma.series.findMany({
          where: {
            id: { notIn: [input.seriesId, ...recommendations.map(r => r.id)] },
            type: baseSeries.type,
          },
          orderBy: { views: "desc" },
          take: input.limit - recommendations.length,
          include: {
            creator: true,
            chapters: { orderBy: { chapterIndex: "asc" } },
          },
        });
        recommendations.push(...extra);
      }

      return recommendations;
    }),

  toggleFollowSeries: protectedProcedure
    .input(z.object({ seriesId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const { seriesId } = input;

      const existing = await ctx.prisma.follow.findUnique({
        where: {
          userId_seriesId: {
            userId,
            seriesId
          }
        }
      });

      if (existing) {
        await ctx.prisma.follow.delete({
          where: {
            id: existing.id
          }
        });
        return { followed: false };
      } else {
        await ctx.prisma.follow.create({
          data: {
            userId,
            seriesId
          }
        });
        return { followed: true };
      }
    }),

  isFollowingSeries: protectedProcedure
    .input(z.object({ seriesId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const existing = await ctx.prisma.follow.findUnique({
        where: {
          userId_seriesId: {
            userId,
            seriesId: input.seriesId,
          },
        },
      });
      return { followed: !!existing };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        seriesId: z.string().uuid(),
        status: z.nativeEnum(SeriesStatus),
        statusMessage: z.string().max(1000).optional().nullable(),
        seasonNumber: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId },
        include: { creatorProfiles: true },
      });
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
      }

      const series = await ctx.prisma.series.findUnique({
        where: { id: input.seriesId },
        include: {
          creator: true,
          collaborators: true,
        },
      });
      if (!series) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Series not found" });
      }

      // Check if user is creator owner, collaborator, or admin
      const isOwner = user.creatorProfiles.some((cp) => cp.id === series.creatorId);
      const isCollab = series.collaborators.some((c) => c.userId === user.id && c.isAgreed);
      const isAdmin = user.role === "ADMIN" || user.role === "MASTER_ADMIN";

      if (!isOwner && !isCollab && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update the status of this series",
        });
      }

      const updatedSeries = await ctx.prisma.series.update({
        where: { id: input.seriesId },
        data: {
          status: input.status,
          statusMessage: input.statusMessage ?? null,
          statusUpdatedAt: new Date(),
        },
        include: {
          creator: true,
        },
      });

      // Broadcast notifications to followers (deduplicated)
      await FollowerNotificationService.notifyStatusChange({
        seriesId: updatedSeries.id,
        seriesTitle: updatedSeries.title,
        status: input.status,
        statusMessage: input.statusMessage,
        seasonNumber: input.seasonNumber,
        creatorProfileId: updatedSeries.creatorId,
        senderUserId: user.id,
      });

      return updatedSeries;
    }),
});
