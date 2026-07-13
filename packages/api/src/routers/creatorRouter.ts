import { z } from "zod";
import { router, protectedProcedure, adminProcedure, creatorProcedure } from "../trpc";
import { CreatorType, ApplicationStatus } from "@panelva/db";
import { TRPCError } from "@trpc/server";

export const creatorRouter = router({
  // 1. Submit Application (User Role)
  submitApplication: protectedProcedure
    .input(
      z.object({
        penName: z.string().min(2),
        bio: z.string().max(500),
        type: z.nativeEnum(CreatorType),
        portfolioUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.creatorApplication.findFirst({
        where: { userId: ctx.session.userId, status: ApplicationStatus.PENDING },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Application already pending review",
        });
      }
      return await ctx.prisma.creatorApplication.create({
        data: {
          userId: ctx.session.userId,
          penName: input.penName,
          bio: input.bio,
          type: input.type,
          portfolioUrl: input.portfolioUrl,
        },
      });
    }),

  // 2. Vetting Queue Review (Admin/Master Admin Role)
  vetApplication: adminProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
        status: z.nativeEnum(ApplicationStatus),
        reviewerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (tx) => {
        const app = await tx.creatorApplication.findUnique({
          where: { id: input.applicationId },
        });
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }
        const updatedApp = await tx.creatorApplication.update({
          where: { id: app.id },
          data: {
            status: input.status,
            reviewedById: ctx.session.userId,
            reviewerNotes: input.reviewerNotes,
          },
        });

        // If approved, create CreatorProfile and update User Role
        if (input.status === ApplicationStatus.APPROVED) {
          await tx.user.update({
            where: { id: app.userId },
            data: { role: "CREATOR" },
          });
          await tx.creatorProfile.create({
            data: {
              userId: app.userId,
              type: app.type,
              penName: app.penName,
              bio: app.bio,
              portfolioUrl: app.portfolioUrl,
              isVetted: true,
            },
          });
        }
        return updatedApp;
      });
    }),

  // 3. Create Series with immutable split (Creator Role)
  createSeries: creatorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string(),
        coverUrl: z.string().url(),
        type: z.enum(["COMIC", "NOVEL"]),
        collaborators: z.array(
          z.object({
            userId: z.string().uuid(),
            shareRatio: z.number().min(0).max(100),
            roleDescription: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorProfile = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId },
      });
      if (!creatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator profile not active",
        });
      }

      const totalRatio = input.collaborators.reduce(
        (acc, c) => acc + c.shareRatio,
        0
      );
      if (totalRatio !== 100.0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Collaborator splits must sum to 100%",
        });
      }

      return await ctx.prisma.$transaction(async (tx) => {
        const series = await tx.series.create({
          data: {
            title: input.title,
            description: input.description,
            coverUrl: input.coverUrl,
            type: input.type,
            creatorId: creatorProfile.id,
          },
        });

        // Insert pending collaborations (both must agree before uploads are opened)
        await tx.collaboration.createMany({
          data: input.collaborators.map((c) => ({
            seriesId: series.id,
            userId: c.userId,
            shareRatio: c.shareRatio,
            roleDescription: c.roleDescription,
            isAgreed: c.userId === ctx.session.userId,
          })),
        });

        return series;
      });
    }),
});
