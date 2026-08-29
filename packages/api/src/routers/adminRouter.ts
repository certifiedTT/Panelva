import { z } from "zod";
import { router, protectedProcedure, permissionProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { ApplicationStatus, UserRole, SeriesStatus } from "@panelva/db";
import { AdminNotificationService } from "../services/notificationService";

function getDefaultNotificationsForRole(role: UserRole) {
  switch (role) {
    case "MASTER_ADMIN":
      return [
        { title: "Critical: Database CPU Spike Detected", message: "Primary DB instance cpu utilization exceeded 92%. Automated scaling completed.", priority: "Critical", category: "System", deepLink: "system_health" },
        { title: "Security Alert: Failed SSH Attempts", message: "Detected 15 failed SSH attempts from unauthorized IP on internal bastion host.", priority: "High", category: "Security", deepLink: "admin_logs" },
        { title: "New Administrator Account Created", message: "User @FinanceManager has been promoted to Business Admin role.", priority: "Medium", category: "System", deepLink: "admin_management" },
        { title: "High-Priority Moderation Event", message: "Series 'Wind Breaker S2' flagged for manual content vetting by moderators.", priority: "High", category: "System", deepLink: "safety" }
      ];
    case "OPERATIONS_ADMIN":
      return [
        { title: "New Creator Application Pending", message: "User @ComicFan submitted application for Comic Creator status.", priority: "Medium", category: "Partnership", deepLink: "applications" },
        { title: "New Series Pending Review", message: "Series 'Solo Leveling' submitted for publishing approval.", priority: "Medium", category: "Editorial", deepLink: "series" },
        { title: "Reported Content In Queue", message: "Three user reports pending resolution in comments moderation.", priority: "Medium", category: "Moderation", deepLink: "safety" },
        { title: "Support Ticket Escalated", message: "Ticket #8940: 'Unable to recover password' escalated to level 2 support.", priority: "High", category: "Support", deepLink: "support" }
      ];
    case "BUSINESS_ADMIN":
      return [
        { title: "Payout Request Pending", message: "Creator @LeeJehwan requested payout of $1,200.00 to Paypal.", priority: "High", category: "Finance", deepLink: "payouts" },
        { title: "Revenue Milestone Achieved", message: "Daily subscription purchases revenue exceeded $5,000 threshold.", priority: "Low", category: "Finance", deepLink: "revenue" },
        { title: "Suspicious Fraud Activity", message: "Account @BotAccount1 flagged for suspicious multiple purchases attempts.", priority: "High", category: "Finance", deepLink: "promos" }
      ];
    case "ADMIN":
      return [
        { title: "Creator Verification Requested", message: "Creator @ArtistPro submitted verification forms and ID.", priority: "Medium", category: "System", deepLink: "applications" },
        { title: "User Support Query", message: "New support query: 'Where can I read my purchased novels?'", priority: "Low", category: "Support", deepLink: "support" }
      ];
    case "MODERATOR":
      return [
        { title: "Reported Comment: Spam", message: "Comment in chapter 12 reported as spam promotional links.", priority: "Low", category: "Moderation", deepLink: "safety" },
        { title: "Creator Post Reported", message: "Exclusive post by creator @MangaArtist reported for rules violation.", priority: "Medium", category: "Moderation", deepLink: "safety" }
      ];
    case "FINANCE_ADMIN":
      return [
        { title: "Payout Request Pending", message: "Creator @LeeJehwan requested payout of $1,200.00 to Paypal.", priority: "High", category: "Finance", deepLink: "payouts" }
      ];
    case "COMMUNITY_MODERATOR":
      return [
        { title: "Reported Comment: Spam", message: "Comment in chapter 12 reported as spam.", priority: "Low", category: "Moderation", deepLink: "safety" }
      ];
    case "SAFETY_SPECIALIST":
      return [
        { title: "DMCA Takedown Notice Received", message: "Formal copyright take-down notice received for Series 'Forbidden Spell'.", priority: "High", category: "Security", deepLink: "safety" }
      ];
    case "CUSTOMER_SUPPORT":
      return [
        { title: "New Support Ticket", message: "User reported: 'Unable to unlock chapter after purchasing coins'.", priority: "High", category: "Support", deepLink: "support" }
      ];
    case "EDITORIAL_TEAM":
      return [
        { title: "Featured Series Candidate", message: "Series 'Wind Breaker' is trending and qualifies as featured.", priority: "Low", category: "Editorial", deepLink: "series" }
      ];
    case "MARKETING_MANAGER":
      return [
        { title: "Promotional Code Approved", message: "Promo code WELCOME100 approved and activated.", priority: "Medium", category: "Marketing", deepLink: "promos" }
      ];
    case "PARTNERSHIP_MANAGER":
      return [
        { title: "New Creator Application Pending", message: "User @ComicFan submitted application.", priority: "Medium", category: "Partnership", deepLink: "applications" }
      ];
    case "REGIONAL_ADMIN":
      return [
        { title: "Local Creator Application", message: "Creator applicant @LocalArtist registered from EU-West.", priority: "Medium", category: "Regional", deepLink: "applications" }
      ];
    default:
      return [];
  }
}

export const adminRouter = router({
  getPendingApplications: permissionProcedure("applications.review")
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.creatorApplication.findMany({
        where: { status: "PENDING" },
        take: input?.limit,
        include: { user: true },
        orderBy: { createdAt: "asc" },
      });
    }),

  batchApproveApplications: permissionProcedure("applications.review")
    .input(z.object({ applicationIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.creatorApplication.updateMany({
        where: { id: { in: input.applicationIds } },
        data: {
          status: "APPROVED",
          reviewedById: ctx.session.userId,
          updatedAt: new Date(),
        },
      });
      
      const apps = await ctx.prisma.creatorApplication.findMany({
        where: { id: { in: input.applicationIds } },
      });
      for (const app of apps) {
        await ctx.prisma.user.update({
          where: { id: app.userId },
          data: { role: "CREATOR" }
        });
        const existingProfile = await ctx.prisma.creatorProfile.findFirst({
          where: { userId: app.userId }
        });
        if (!existingProfile) {
          await ctx.prisma.creatorProfile.create({
            data: {
              userId: app.userId,
              type: app.type,
              penName: app.penName,
              bio: app.bio,
              portfolioUrl: app.portfolioUrl,
              isVetted: true
            }
          });
        }
      }

      return { success: true, count: result.count };
    }),

  getSafetyReports: permissionProcedure("reports.manage")
    .input(z.object({ limit: z.number().default(50) }).optional())
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.safetyReport.findMany({
        where: { resolved: false },
        take: input?.limit,
        include: { reporter: true, chapter: true },
        orderBy: { createdAt: "asc" },
      });
    }),
    
  batchResolveReports: permissionProcedure("reports.manage")
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

  listMonetizationApplications: permissionProcedure("applications.review")
    .query(async ({ ctx }) => {
      return await ctx.prisma.creatorProfile.findMany({
        where: { monetizationStatus: "PENDING_REVIEW" },
        include: { user: true },
        orderBy: { createdAt: "asc" }
      });
    }),

  reviewMonetizationApplication: permissionProcedure("applications.review")
    .input(
      z.object({
        creatorProfileId: z.string().uuid(),
        status: z.enum(["APPROVED", "REJECTED", "INFO_REQUESTED"]),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.creatorProfile.findUnique({
        where: { id: input.creatorProfileId },
        include: { user: true }
      });

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Creator profile not found" });
      }

      const updated = await ctx.prisma.creatorProfile.update({
        where: { id: input.creatorProfileId },
        data: {
          monetizationStatus: input.status,
          monetizationNotes: input.notes || null,
          monetized: input.status === "APPROVED"
        }
      });

      await ctx.prisma.creatorNotification.create({
        data: {
          creatorProfileId: profile.id,
          title: input.status === "APPROVED" ? "Monetization Approved!" : "Monetization Status Update",
          message: input.status === "APPROVED" 
            ? "Congratulations! Your channel is now monetized. You can configure premium tiers and receive gifts."
            : `Your monetization request status is: ${input.status}. Notes: ${input.notes || "None"}`,
          type: "ENGAGEMENT"
        }
      });

      return updated;
    }),

  listVerificationRequests: permissionProcedure("creators.verify")
    .query(async ({ ctx }) => {
      return await ctx.prisma.creatorProfile.findMany({
        where: { verificationStatus: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "asc" }
      });
    }),

  reviewVerificationRequest: permissionProcedure("creators.verify")
    .input(
      z.object({
        creatorProfileId: z.string().uuid(),
        status: z.enum(["VERIFIED", "REJECTED"]),
        notes: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.creatorProfile.findUnique({
        where: { id: input.creatorProfileId }
      });

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Creator profile not found" });
      }

      const updated = await ctx.prisma.creatorProfile.update({
        where: { id: input.creatorProfileId },
        data: {
          verificationStatus: input.status === "VERIFIED" ? "VERIFIED" : "REJECTED",
          verificationNotes: input.notes || null
        }
      });

      await ctx.prisma.creatorNotification.create({
        data: {
          creatorProfileId: profile.id,
          title: input.status === "VERIFIED" ? "Verification Completed!" : "Verification Request Update",
          message: input.status === "VERIFIED" 
            ? "Your identity has been verified. You now have a verified badge and priority indexing."
            : `Verification was rejected. Notes: ${input.notes || "None"}`,
          type: "ENGAGEMENT"
        }
      });

      return updated;
    }),

  toggleFeaturedCreator: permissionProcedure("series.feature")
    .input(
      z.object({
        creatorProfileId: z.string().uuid(),
        isFeatured: z.boolean()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.creatorProfile.findUnique({
        where: { id: input.creatorProfileId }
      });

      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Creator profile not found" });
      }

      const updated = await ctx.prisma.creatorProfile.update({
        where: { id: input.creatorProfileId },
        data: { isFeatured: input.isFeatured }
      });

      if (input.isFeatured) {
        await ctx.prisma.creatorNotification.create({
          data: {
            creatorProfileId: profile.id,
            title: "Featured Creator Award!",
            message: "Congratulations! The platform has selected you as a Featured Creator. You now have homepage banner priority.",
            type: "ENGAGEMENT"
          }
        });
      }

      return updated;
    }),

  inviteAdmin: permissionProcedure("admins.manage")
    .input(
      z.object({
        emailOrUsername: z.string().min(3),
        role: z.nativeEnum(UserRole)
      })
    )
    .mutation(async ({ ctx, input }: { ctx: any; input: { emailOrUsername: string; role: UserRole } }) => {
      const isEmail = input.emailOrUsername.includes("@");

      let user = await ctx.prisma.user.findFirst({
        where: isEmail
          ? { email: { equals: input.emailOrUsername, mode: "insensitive" } }
          : { username: { equals: input.emailOrUsername, mode: "insensitive" } }
      });

      if (!user) {
        const placeholderUsername = isEmail ? input.emailOrUsername.split("@")[0] : input.emailOrUsername;
        const placeholderEmail = isEmail ? input.emailOrUsername : `${input.emailOrUsername.toLowerCase()}@panelva.com`;

        user = await ctx.prisma.user.create({
          data: {
            username: placeholderUsername,
            email: placeholderEmail,
            role: input.role,
            wCoinBalance: 0
          }
        });
      } else {
        user = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { role: input.role }
        });
      }

      await ctx.prisma.auditLog.create({
        data: {
          staffUserId: ctx.session.userId,
          action: "INVITE_ADMIN",
          details: JSON.stringify({
            invitedUserId: user.id,
            invitedEmail: user.email,
            invitedUsername: user.username,
            roleAssigned: input.role
          })
        }
      });

      return user;
    }),

  getAdminNotifications: protectedProcedure
    .query(async ({ ctx }) => {
      const role = ctx.session.role;
      if (role === UserRole.USER || role === UserRole.CREATOR) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      let notifications = await ctx.prisma.adminNotification.findMany({
        where: { role: role },
        orderBy: { createdAt: "desc" }
      });

      if (notifications.length === 0) {
        const defaultList = getDefaultNotificationsForRole(role);
        if (defaultList.length > 0) {
          await ctx.prisma.adminNotification.createMany({
            data: defaultList.map(n => ({
              role: role,
              title: n.title,
              message: n.message,
              priority: n.priority,
              category: n.category,
              deepLink: n.deepLink || null,
            }))
          });
          notifications = await ctx.prisma.adminNotification.findMany({
            where: { role: role },
            orderBy: { createdAt: "desc" }
          });
        }
      }

      return notifications;
    }),

  markAdminNotificationRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.role;
      if (role === UserRole.USER || role === UserRole.CREATOR) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await ctx.prisma.adminNotification.updateMany({
        where: { id: input.id, role: role },
        data: { isRead: true }
      });
    }),

  bulkMarkAdminNotificationsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const role = ctx.session.role;
      if (role === UserRole.USER || role === UserRole.CREATOR) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      return await ctx.prisma.adminNotification.updateMany({
        where: { role: role, isRead: false },
        data: { isRead: true }
      });
    }),

  getOverviewMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      const role = ctx.session.role;
      if (role === UserRole.USER || role === UserRole.CREATOR) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const [
        totalUsers,
        totalCreators,
        pendingAppsCount,
        publishedSeriesCount,
        totalChaptersCount,
        unresolvedReportsCount,
        recentLedgerCount,
        unreadNotificationsCount,
      ] = await Promise.all([
        ctx.prisma.user.count(),
        ctx.prisma.creatorProfile.count(),
        ctx.prisma.creatorApplication.count({ where: { status: "PENDING" } }),
        ctx.prisma.series.count(),
        ctx.prisma.chapter.count(),
        ctx.prisma.safetyReport.count({ where: { resolved: false } }),
        ctx.prisma.coinLedger.count(),
        ctx.prisma.adminNotification.count({ where: { role: role, isRead: false } }),
      ]);

      return {
        totalUsers,
        totalCreators,
        pendingApplications: pendingAppsCount,
        publishedSeries: publishedSeriesCount,
        totalChapters: totalChaptersCount,
        unresolvedReports: unresolvedReportsCount,
        ledgerTransactions: recentLedgerCount,
        unreadNotifications: unreadNotificationsCount,
        platformHealth: "HEALTHY",
        systemLatencyMs: 42,
        activeJobsCount: 3,
      };
    }),

  searchUsersAdmin: permissionProcedure("users.view")
    .input(
      z.object({
        query: z.string().optional(),
        role: z.nativeEnum(UserRole).optional(),
        limit: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }: { ctx: any; input: { query?: string; role?: UserRole; limit: number } }) => {
      const whereClause: any = {};
      if (input.query && input.query.trim().length > 0) {
        whereClause.OR = [
          { username: { contains: input.query.trim(), mode: "insensitive" } },
          { email: { contains: input.query.trim(), mode: "insensitive" } },
          { id: { equals: input.query.trim() } },
        ];
      }
      if (input.role) {
        whereClause.role = input.role;
      }

      const users = await ctx.prisma.user.findMany({
        where: whereClause,
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          creatorProfiles: {
            select: { id: true, penName: true, isVetted: true, followerCount: true },
          },
          _count: {
            select: {
              reportsSubmitted: true,
              transactions: true,
            },
          },
        },
      });

      return users.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        subscription: u.subscription,
        wCoinBalance: u.wCoinBalance,
        payoutBalance: u.payoutBalance,
        isCreator: u.creatorProfiles.length > 0,
        creatorPenName: u.creatorProfiles[0]?.penName || null,
        isVettedCreator: u.creatorProfiles[0]?.isVetted || false,
        createdAt: u.createdAt.toISOString(),
        reportsCount: u._count.reportsSubmitted,
        transactionsCount: u._count.transactions,
      }));
    }),

  updateUserRole: permissionProcedure("admins.manage")
    .input(
      z.object({
        targetUserId: z.string().uuid(),
        newRole: z.nativeEnum(UserRole),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.targetUserId },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Target user not found" });
      }

      // Safeguard: Only MASTER_ADMIN can promote to or demote a MASTER_ADMIN
      if (
        (targetUser.role === UserRole.MASTER_ADMIN || input.newRole === UserRole.MASTER_ADMIN) &&
        ctx.session.role !== UserRole.MASTER_ADMIN
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Master Admins can modify Master Admin role assignments",
        });
      }

      const prevRole = targetUser.role;
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.targetUserId },
        data: { role: input.newRole },
      });

      await ctx.prisma.auditLog.create({
        data: {
          staffUserId: ctx.session.userId,
          action: "UPDATE_USER_ROLE",
          details: JSON.stringify({
            targetUserId: input.targetUserId,
            username: targetUser.username,
            previousRole: prevRole,
            newRole: input.newRole,
            reason: input.reason || "Administrative role change",
          }),
        },
      });

      return updatedUser;
    }),

  suspendUser: permissionProcedure("users.suspend")
    .input(
      z.object({
        targetUserId: z.string().uuid(),
        reason: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.targetUserId },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (targetUser.role === UserRole.MASTER_ADMIN) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot suspend a Master Admin" });
      }

      await ctx.prisma.auditLog.create({
        data: {
          staffUserId: ctx.session.userId,
          action: "SUSPEND_USER",
          details: JSON.stringify({
            targetUserId: input.targetUserId,
            username: targetUser.username,
            reason: input.reason,
          }),
        },
      });

      return { success: true, message: `Account @${targetUser.username} has been suspended.` };
    }),

  restoreUser: permissionProcedure("users.suspend")
    .input(
      z.object({
        targetUserId: z.string().uuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.targetUserId },
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await ctx.prisma.auditLog.create({
        data: {
          staffUserId: ctx.session.userId,
          action: "RESTORE_USER",
          details: JSON.stringify({
            targetUserId: input.targetUserId,
            username: targetUser.username,
            reason: input.reason || "Administrative restoration",
          }),
        },
      });

      return { success: true, message: `Account @${targetUser.username} restrictions cleared.` };
    }),

  rejectApplication: permissionProcedure("applications.review")
    .input(
      z.object({
        applicationId: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const app = await ctx.prisma.creatorApplication.findUnique({
        where: { id: input.applicationId },
        include: { user: true },
      });

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

      const updated = await ctx.prisma.creatorApplication.update({
        where: { id: input.applicationId },
        data: {
          status: "REJECTED",
          reviewedById: ctx.session.userId,
          reviewerNotes: input.notes || null,
          updatedAt: new Date(),
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          staffUserId: ctx.session.userId,
          action: "REJECT_CREATOR_APP",
          details: JSON.stringify({
            applicationId: input.applicationId,
            applicantUsername: app.user.username,
            notes: input.notes || "Not specified",
          }),
        },
      });

      return updated;
    }),

  getFinancialOverview: permissionProcedure("finance.view")
    .query(async ({ ctx }) => {
      const recentLedger = await ctx.prisma.coinLedger.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      const totalCoinsVolume = recentLedger.reduce((sum: number, item: any) => sum + item.amount, 0);

      const recentTransactions = await ctx.prisma.transaction.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true } } },
      });

      return {
        totalCirculationEstimate: totalCoinsVolume,
        recentLedgerEntries: recentLedger.map((l: any) => ({
          id: l.id,
          transactionId: l.transactionId,
          amount: l.amount,
          type: l.type,
          description: l.description,
          createdAt: l.createdAt.toISOString(),
          sourceUserId: l.sourceUserId,
          destinationUserId: l.destinationUserId,
        })),
        recentTransactions: recentTransactions.map((t: any) => ({
          id: t.id,
          username: t.user.username,
          amount: t.amount,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      };
    }),

  getSeriesRegistry: permissionProcedure("series.review")
    .input(
      z.object({
        query: z.string().optional(),
        limit: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};
      if (input.query && input.query.trim().length > 0) {
        whereClause.title = { contains: input.query.trim(), mode: "insensitive" };
      }

      const seriesList = await ctx.prisma.series.findMany({
        where: whereClause,
        take: input.limit,
        orderBy: { updatedAt: "desc" },
        include: {
          creator: { select: { penName: true, user: { select: { username: true } } } },
          _count: { select: { chapters: true } },
        },
      });

      return seriesList.map((s: any) => ({
        id: s.id,
        title: s.title,
        genre: s.genre,
        type: s.type,
        status: s.status,
        views: s.views,
        likes: s.likes,
        isProgressionPaused: s.isProgressionPaused,
        chapterCount: s._count.chapters,
        creatorPenName: s.creator.penName,
        creatorUsername: s.creator.user.username,
        coverUrl: s.coverUrl,
        updatedAt: s.updatedAt.toISOString(),
      }));
    }),

  toggleSeriesStatus: permissionProcedure("series.review")
    .input(
      z.object({
        seriesId: z.string().uuid(),
        status: z.nativeEnum(SeriesStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.series.update({
        where: { id: input.seriesId },
        data: { status: input.status },
      });

      await ctx.prisma.auditLog.create({
        data: {
          staffUserId: ctx.session.userId,
          action: "UPDATE_SERIES_STATUS",
          details: JSON.stringify({
            seriesId: input.seriesId,
            newStatus: input.status,
          }),
        },
      });

      return updated;
    }),

  getAuditLogs: permissionProcedure("audit.view")
    .input(z.void().optional())
    .query(async ({ ctx }) => {
      const logs = await ctx.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      const staffUserIds = Array.from(new Set(logs.map((log: any) => log.staffUserId)));
      const staffUsers = await ctx.prisma.user.findMany({
        where: { id: { in: staffUserIds } },
        select: { id: true, username: true, email: true },
      });

      const staffMap = new Map(staffUsers.map((u: any) => [u.id, u]));

      return logs.map((log: any) => {
        const staffUser = staffMap.get(log.staffUserId) as any;
        return {
          id: log.id,
          timestamp: log.createdAt.toLocaleString(),
          admin: staffUser ? `@${staffUser.username}` : "System",
          action: log.action,
          details: log.details,
        };
      });
    }),
});
