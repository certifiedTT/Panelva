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
        details: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.creatorApplication.findFirst({
        where: {
          userId: ctx.session.userId,
          status: { in: [ApplicationStatus.PENDING, ApplicationStatus.INFO_REQUESTED] },
        },
      });

      if (existing) {
        if (existing.status === ApplicationStatus.PENDING) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Application already pending review",
          });
        }

        // If status was INFO_REQUESTED, allow updating/resubmitting
        const detailsJsonObj = {
          ...(input.details || {}),
          resubmittedAt: new Date().toISOString(),
          reviewHistory: (() => {
            try {
              const oldDetails = JSON.parse(existing.detailsJson || "{}");
              const history = oldDetails.reviewHistory || [];
              history.push({
                action: "RESUBMIT",
                timestamp: new Date().toISOString(),
                notes: "Applicant resubmitted with updated information."
              });
              return history;
            } catch (e) {
              return [];
            }
          })()
        };

        return await ctx.prisma.creatorApplication.update({
          where: { id: existing.id },
          data: {
            penName: input.penName,
            bio: input.bio,
            type: input.type,
            portfolioUrl: input.portfolioUrl,
            detailsJson: JSON.stringify(detailsJsonObj),
            status: ApplicationStatus.PENDING,
          },
        });
      }

      const initialDetails = {
        ...(input.details || {}),
        reviewHistory: [
          {
            action: "SUBMIT",
            timestamp: new Date().toISOString(),
            notes: "Application initial submission."
          }
        ]
      };

      return await ctx.prisma.creatorApplication.create({
        data: {
          userId: ctx.session.userId,
          penName: input.penName,
          bio: input.bio,
          type: input.type,
          portfolioUrl: input.portfolioUrl,
          detailsJson: JSON.stringify(initialDetails),
          status: ApplicationStatus.PENDING,
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
          include: { user: true }
        });
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }

        // Parse detailsJson and append to review history
        let detailsJsonObj: any = {};
        try {
          detailsJsonObj = JSON.parse(app.detailsJson || "{}");
        } catch (e) {
          detailsJsonObj = {};
        }

        if (!detailsJsonObj.reviewHistory) {
          detailsJsonObj.reviewHistory = [];
        }

        const reviewerUser = await tx.user.findUnique({
          where: { id: ctx.session.userId },
        });

        detailsJsonObj.reviewHistory.push({
          action: input.status,
          timestamp: new Date().toISOString(),
          reviewerId: ctx.session.userId,
          reviewerName: reviewerUser?.username || "Admin",
          notes: input.reviewerNotes || "",
        });

        const updatedApp = await tx.creatorApplication.update({
          where: { id: app.id },
          data: {
            status: input.status,
            reviewedById: ctx.session.userId,
            reviewerNotes: input.reviewerNotes,
            detailsJson: JSON.stringify(detailsJsonObj),
          },
        });

        // Write to global audit log
        await tx.auditLog.create({
          data: {
            staffUserId: ctx.session.userId,
            action: `VET_APPLICATION_${input.status}`,
            details: JSON.stringify({
              applicationId: app.id,
              applicantUserId: app.userId,
              penName: app.penName,
              reviewerNotes: input.reviewerNotes || "",
            }),
          },
        });

        // If approved, create CreatorProfile and update User Role
        if (input.status === ApplicationStatus.APPROVED) {
          await tx.user.update({
            where: { id: app.userId },
            data: { role: "CREATOR" },
          });
          
          // Check if CreatorProfile already exists
          const existingProfile = await tx.creatorProfile.findFirst({
            where: { userId: app.userId }
          });

          if (!existingProfile) {
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
          } else {
            await tx.creatorProfile.update({
              where: { id: existingProfile.id },
              data: {
                type: app.type,
                penName: app.penName,
                bio: app.bio,
                portfolioUrl: app.portfolioUrl,
                isVetted: true,
              }
            });
          }
        }
        return updatedApp;
      });
    }),

  // 3. List Applications (Admin Role)
  listApplications: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        type: z.string().optional(),
        sortBy: z.enum(["createdAt_desc", "createdAt_asc", "penName_asc", "penName_desc"]).default("createdAt_desc"),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const take = input.limit;

      const where: any = {};

      if (input.status && input.status !== "ALL") {
        where.status = input.status;
      }
      if (input.type && input.type !== "ALL") {
        where.type = input.type;
      }
      if (input.search) {
        where.OR = [
          { penName: { contains: input.search, mode: "insensitive" } },
          { user: { username: { contains: input.search, mode: "insensitive" } } },
          { user: { email: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      let orderBy: any = { createdAt: "desc" };
      if (input.sortBy === "createdAt_asc") {
        orderBy = { createdAt: "asc" };
      } else if (input.sortBy === "penName_asc") {
        orderBy = { penName: "asc" };
      } else if (input.sortBy === "penName_desc") {
        orderBy = { penName: "desc" };
      }

      const [items, total] = await Promise.all([
        ctx.prisma.creatorApplication.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
              }
            }
          },
          orderBy,
          skip,
          take,
        }),
        ctx.prisma.creatorApplication.count({ where }),
      ]);

      return {
        items,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // 4. Get Application Details (Admin Role)
  getApplicationDetails: adminProcedure
    .input(
      z.object({
        applicationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const app = await ctx.prisma.creatorApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
              createdAt: true,
            }
          }
        }
      });

      if (!app) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      // Query database audit logs for this application
      const auditLogs = await ctx.prisma.auditLog.findMany({
        where: {
          details: {
            contains: input.applicationId,
          }
        },
        orderBy: {
          createdAt: "desc",
        }
      });

      return {
        application: app,
        auditLogs,
      };
    }),

  // 5. Get current user's applicant status
  getApplicantStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.creatorApplication.findFirst({
        where: { userId: ctx.session.userId },
        orderBy: { updatedAt: "desc" }
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

  // Analytics Dashboard Data (Creator Role)
  getAnalytics: creatorProcedure
    .input(z.object({ days: z.number().default(30) }).optional())
    .query(async ({ ctx, input }) => {
      // In a real app we would aggregate ReadingHistory and CoinLedger records.
      // For Phase 4 we will generate mock time-series data for the dashboard.
      const days = input?.days || 30;
      const data = [];
      let baseViews = 5000;
      let baseRevenue = 200;

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some random noise
        const viewNoise = Math.floor(Math.random() * 1000) - 500;
        const revenueNoise = Math.floor(Math.random() * 50) - 25;

        data.push({
          date: date.toISOString().split("T")[0],
          views: Math.max(0, baseViews + viewNoise),
          revenue: Math.max(0, baseRevenue + revenueNoise),
        });

        // Slight upward trend
        baseViews += 50;
        baseRevenue += 2;
      }

      return data;
    }),
});
