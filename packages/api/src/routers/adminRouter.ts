import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { ApplicationStatus } from "@panelva/db";

// Middleware to ensure user is at least an ADMIN
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.userId },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "MASTER_ADMIN")) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  getPendingApplications: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.creatorApplication.findMany({
        where: { status: "PENDING" },
        take: input?.limit,
        include: { user: true },
        orderBy: { createdAt: "asc" },
      });
    }),

  batchApproveApplications: adminProcedure
    .input(z.object({ applicationIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      // In a real app we might run this in a transaction and also update CreatorProfile
      const result = await ctx.prisma.creatorApplication.updateMany({
        where: { id: { in: input.applicationIds } },
        data: {
          status: "APPROVED",
          reviewedById: ctx.session.userId,
          updatedAt: new Date(),
        },
      });
      return { success: true, count: result.count };
    }),

  getSafetyReports: adminProcedure
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.safetyReport.findMany({
        where: { resolved: false },
        take: input?.limit,
        include: { reporter: true, chapter: true },
        orderBy: { createdAt: "asc" },
      });
    }),
    
  batchResolveReports: adminProcedure
    .input(z.object({ reportIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.safetyReport.updateMany({
        where: { id: { in: input.reportIds } },
        data: {
          resolved: true,
          resolvedById: ctx.session.userId,
          updatedAt: new Date(),
        },
      });
      return { success: true, count: result.count };
    }),
});
