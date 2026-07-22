import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { SeriesType, SeriesStatus } from "@panelva/db";
import { TRPCError } from "@trpc/server";

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
            orderBy: { chapterIndex: "asc" },
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
        type: z.enum(["COMIC", "NOVEL"]),
        searchQuery: z.string().optional(),
        genre: z.string().optional(),
        status: z.nativeEnum(SeriesStatus).optional(),
        sortBy: z.enum(["Popularity", "Likes", "Newest", "Alphabetical"]).default("Popularity"),
        limit: z.number().min(1).max(100).default(24),
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

      const where: any = {
        type: input.type,
      };

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
        include: {
          creator: true,
          chapters: {
            orderBy: { chapterIndex: "asc" },
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
            orderBy: { chapterIndex: "asc" },
          },
          collaborators: true,
        },
      });

      if (!series) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Series not found" });
      }

      return series;
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
});
