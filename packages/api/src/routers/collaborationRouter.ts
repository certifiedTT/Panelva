import { z } from "zod";
import { router, protectedProcedure, creatorProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const collaborationRouter = router({
  // 1. Send Collaboration Invitation
  sendInvitation: creatorProcedure
    .input(
      z.object({
        seriesId: z.string().uuid(),
        receiverId: z.string().uuid(),
        role: z.string().min(1),
        roleDescription: z.string().optional(),
        shareRatio: z.number().min(0).max(100),
        message: z.string().optional(),
        terms: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the primary creator profile
      const senderProfile = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId },
      });
      if (!senderProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator profile not active",
        });
      }

      // Check if series exists and sender is the owner
      const series = await ctx.prisma.series.findUnique({
        where: { id: input.seriesId },
      });
      if (!series) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Series not found",
        });
      }
      if (series.creatorId !== senderProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the primary creator of this series can send invitations",
        });
      }

      // Self-invitation check
      if (input.receiverId === ctx.session.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot invite yourself to collaborate",
        });
      }

      // Check if receiver is a verified creator
      const receiverProfile = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: input.receiverId, isVetted: true },
        include: { user: true },
      });
      if (!receiverProfile) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Collaboration invitations may only be sent to verified and registered creator accounts on the platform.",
        });
      }

      // Check if receiver is already an active collaborator
      const existingCollab = await ctx.prisma.collaboration.findUnique({
        where: {
          seriesId_userId: {
            seriesId: input.seriesId,
            userId: input.receiverId,
          },
        },
      });
      if (existingCollab) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Creator is already a collaborator on this series",
        });
      }

      // Check for active pending invitation to this user
      const existingInvitation = await ctx.prisma.collaborationInvitation.findFirst({
        where: {
          seriesId: input.seriesId,
          receiverId: input.receiverId,
          status: "PENDING",
        },
      });
      if (existingInvitation) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pending invitation already exists for this creator on this series",
        });
      }

      // Fetch active collaborations (excluding primary creator to see other co-creators)
      const primaryCreatorUser = await ctx.prisma.user.findFirst({
        where: { creatorProfiles: { some: { id: series.creatorId } } },
      });
      if (!primaryCreatorUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Primary creator user not found",
        });
      }

      const activeCollaborators = await ctx.prisma.collaboration.findMany({
        where: {
          seriesId: input.seriesId,
          NOT: { userId: primaryCreatorUser.id },
        },
      });

      const pendingInvitations = await ctx.prisma.collaborationInvitation.findMany({
        where: {
          seriesId: input.seriesId,
          status: "PENDING",
        },
      });

      const currentAllocated = activeCollaborators.reduce((acc, c) => acc + c.shareRatio, 0) +
        pendingInvitations.reduce((acc, i) => acc + i.shareRatio, 0);

      if (currentAllocated + input.shareRatio > 100) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `The proposed share ratio of ${input.shareRatio}% would exceed the remaining available revenue split of ${(100 - currentAllocated).toFixed(1)}%`,
        });
      }

      // Create the invitation
      return await ctx.prisma.$transaction(async (tx) => {
        const invitation = await tx.collaborationInvitation.create({
          data: {
            seriesId: input.seriesId,
            senderId: ctx.session.userId,
            receiverId: input.receiverId,
            role: input.role,
            roleDescription: input.roleDescription,
            shareRatio: input.shareRatio,
            message: input.message,
            terms: input.terms,
            status: "PENDING",
          },
        });

        // Audit Log
        await tx.collaborationAuditLog.create({
          data: {
            seriesId: input.seriesId,
            actorId: ctx.session.userId,
            action: "INVITATION_SENT",
            details: JSON.stringify({
              receiverId: input.receiverId,
              role: input.role,
              shareRatio: input.shareRatio,
            }),
          },
        });

        return invitation;
      });
    }),

  // 2. Respond to Collaboration Invitation
  respondToInvitation: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
        response: z.enum(["ACCEPT", "DECLINE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.collaborationInvitation.findUnique({
        where: { id: input.invitationId },
        include: { series: true },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invitation has already been ${invitation.status.toLowerCase()}`,
        });
      }

      if (invitation.receiverId !== ctx.session.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the recipient can respond to this invitation",
        });
      }

      if (input.response === "DECLINE") {
        return await ctx.prisma.$transaction(async (tx) => {
          const updated = await tx.collaborationInvitation.update({
            where: { id: input.invitationId },
            data: { status: "DECLINED" },
          });

          await tx.collaborationAuditLog.create({
            data: {
              seriesId: invitation.seriesId,
              actorId: ctx.session.userId,
              action: "INVITATION_DECLINED",
              details: JSON.stringify({
                senderId: invitation.senderId,
                role: invitation.role,
                shareRatio: invitation.shareRatio,
              }),
            },
          });

          return updated;
        });
      }

      // If ACCEPT:
      return await ctx.prisma.$transaction(async (tx) => {
        // Double check splits totals
        const primaryCreatorUser = await tx.user.findFirst({
          where: { creatorProfiles: { some: { id: invitation.series.creatorId } } },
        });

        if (!primaryCreatorUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Primary creator user not found",
          });
        }

        const activeCollaborators = await tx.collaboration.findMany({
          where: {
            seriesId: invitation.seriesId,
            NOT: { userId: primaryCreatorUser.id },
          },
        });

        const currentAllocated = activeCollaborators.reduce((acc, c) => acc + c.shareRatio, 0);

        if (currentAllocated + invitation.shareRatio > 100) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Accepting this invitation would exceed 100% total revenue allocation.",
          });
        }

        // Accept invitation
        const updatedInvitation = await tx.collaborationInvitation.update({
          where: { id: input.invitationId },
          data: { status: "ACCEPTED" },
        });

        // Add collaborator
        await tx.collaboration.upsert({
          where: {
            seriesId_userId: {
              seriesId: invitation.seriesId,
              userId: invitation.receiverId,
            },
          },
          update: {
            shareRatio: invitation.shareRatio,
            role: invitation.role,
            roleDescription: invitation.roleDescription,
            isAgreed: true,
            agreedAt: new Date(),
          },
          create: {
            seriesId: invitation.seriesId,
            userId: invitation.receiverId,
            shareRatio: invitation.shareRatio,
            role: invitation.role,
            roleDescription: invitation.roleDescription,
            isAgreed: true,
            agreedAt: new Date(),
          },
        });

        // Ensure primary creator is in the collaboration splits as well
        const newPrimaryRatio = 100 - (currentAllocated + invitation.shareRatio);
        await tx.collaboration.upsert({
          where: {
            seriesId_userId: {
              seriesId: invitation.seriesId,
              userId: primaryCreatorUser.id,
            },
          },
          update: {
            shareRatio: newPrimaryRatio,
          },
          create: {
            seriesId: invitation.seriesId,
            userId: primaryCreatorUser.id,
            shareRatio: newPrimaryRatio,
            role: "Primary Creator",
            isAgreed: true,
            agreedAt: new Date(),
          },
        });

        // Audit Log
        await tx.collaborationAuditLog.create({
          data: {
            seriesId: invitation.seriesId,
            actorId: ctx.session.userId,
            action: "INVITATION_ACCEPTED",
            details: JSON.stringify({
              senderId: invitation.senderId,
              role: invitation.role,
              shareRatio: invitation.shareRatio,
            }),
          },
        });

        return updatedInvitation;
      });
    }),

  // 3. Cancel Collaboration Invitation
  cancelInvitation: creatorProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.collaborationInvitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invitation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invitation has already been ${invitation.status.toLowerCase()}`,
        });
      }

      if (invitation.senderId !== ctx.session.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the sender can cancel this invitation",
        });
      }

      return await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.collaborationInvitation.update({
          where: { id: input.invitationId },
          data: { status: "CANCELLED" },
        });

        await tx.collaborationAuditLog.create({
          data: {
            seriesId: invitation.seriesId,
            actorId: ctx.session.userId,
            action: "INVITATION_CANCELLED",
            details: JSON.stringify({
              receiverId: invitation.receiverId,
              role: invitation.role,
              shareRatio: invitation.shareRatio,
            }),
          },
        });

        return updated;
      });
    }),

  // 4. Get Received Collaboration Invitations
  getReceivedInvitations: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.collaborationInvitation.findMany({
      where: {
        receiverId: ctx.session.userId,
        status: "PENDING",
      },
      include: {
        series: {
          include: {
            creator: {
              include: {
                user: true,
              },
            },
          },
        },
        sender: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // 5. Get Sent Collaboration Invitations
  getSentInvitations: creatorProcedure
    .input(
      z.object({
        seriesId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.collaborationInvitation.findMany({
        where: {
          senderId: ctx.session.userId,
          seriesId: input.seriesId,
        },
        include: {
          series: true,
          receiver: {
            include: {
              creatorProfiles: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // 6. Get Active Collaborations & Pending invitations for a Series
  getSeriesCollaborations: protectedProcedure
    .input(
      z.object({
        seriesId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const series = await ctx.prisma.series.findUnique({
        where: { id: input.seriesId },
        include: { creator: true },
      });

      if (!series) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Series not found",
        });
      }

      // Check permissions: current user must be primary creator, active collaborator, or receiver of a pending invitation
      const isCreator = series.creator.userId === ctx.session.userId;

      const activeCollaborators = await ctx.prisma.collaboration.findMany({
        where: { seriesId: input.seriesId },
        include: {
          user: {
            include: {
              creatorProfiles: true,
            },
          },
        },
      });

      const pendingInvitations = await ctx.prisma.collaborationInvitation.findMany({
        where: { seriesId: input.seriesId, status: "PENDING" },
        include: {
          receiver: {
            include: {
              creatorProfiles: true,
            },
          },
        },
      });

      const auditLogs = await ctx.prisma.collaborationAuditLog.findMany({
        where: { seriesId: input.seriesId },
        include: {
          actor: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const isActiveCollab = activeCollaborators.some((c) => c.userId === ctx.session.userId);
      const isPendingInvitee = pendingInvitations.some((i) => i.receiverId === ctx.session.userId);

      if (!isCreator && !isActiveCollab && !isPendingInvitee) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to view collaborations for this series",
        });
      }

      return {
        activeCollaborators,
        pendingInvitations,
        auditLogs,
      };
    }),

  // 7. List Vetted Creators
  listVettedCreators: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.creatorProfile.findMany({
      where: { isVetted: true, NOT: { userId: ctx.session.userId } },
      include: { user: true },
    });
  }),
});
