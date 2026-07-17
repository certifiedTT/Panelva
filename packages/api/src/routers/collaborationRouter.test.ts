import { describe, it, expect, beforeAll } from "vitest";
import { prisma, Role } from "@panelva/db";
import { appRouter } from "./index";
import { createTRPCContext } from "../context";

describe("Creator Collaboration tRPC Router", () => {
  let primaryUser: any;
  let coCreatorUser: any;
  let coCreatorUser2: any;
  let normalUser: any;

  let primaryProfile: any;
  let coCreatorProfile: any;
  let coCreatorProfile2: any;

  let series: any;

  beforeAll(async () => {
    // Generate unique emails/usernames to avoid DB index clashes
    const suffix = Date.now();

    primaryUser = await prisma.user.create({
      data: {
        email: `primary-${suffix}@panelva.com`,
        username: `primary_${suffix}`,
        role: Role.CREATOR,
      },
    });

    primaryProfile = await prisma.creatorProfile.create({
      data: {
        userId: primaryUser.id,
        penName: `Primary_${suffix}`,
        type: "WRITER",
        portfolioUrl: "https://example.com/p",
        isVetted: true,
      },
    });

    coCreatorUser = await prisma.user.create({
      data: {
        email: `cocreator-${suffix}@panelva.com`,
        username: `cocreator_${suffix}`,
        role: Role.CREATOR,
      },
    });

    coCreatorProfile = await prisma.creatorProfile.create({
      data: {
        userId: coCreatorUser.id,
        penName: `Artist_${suffix}`,
        type: "ARTIST",
        portfolioUrl: "https://example.com/a",
        isVetted: true,
      },
    });

    coCreatorUser2 = await prisma.user.create({
      data: {
        email: `cocreator2-${suffix}@panelva.com`,
        username: `cocreator2_${suffix}`,
        role: Role.CREATOR,
      },
    });

    coCreatorProfile2 = await prisma.creatorProfile.create({
      data: {
        userId: coCreatorUser2.id,
        penName: `Colorist_${suffix}`,
        type: "ARTIST",
        portfolioUrl: "https://example.com/c2",
        isVetted: true,
      },
    });

    normalUser = await prisma.user.create({
      data: {
        email: `normal-${suffix}@panelva.com`,
        username: `normal_${suffix}`,
        role: Role.USER,
      },
    });

    series = await prisma.series.create({
      data: {
        title: `Collab Series ${suffix}`,
        description: "Test series description",
        coverUrl: "https://example.com/cover.png",
        type: "COMIC",
        creatorId: primaryProfile.id,
      },
    });

    // Add primary creator to Collaboration splits with 100% initially
    await prisma.collaboration.create({
      data: {
        seriesId: series.id,
        userId: primaryUser.id,
        shareRatio: 100,
        role: "Primary Creator",
        isAgreed: true,
        agreedAt: new Date(),
      },
    });
  });

  it("fails to send an invitation if the sender is not the primary creator of the series", async () => {
    const ctx = await createTRPCContext({
      session: {
        userId: coCreatorUser.id,
        email: coCreatorUser.email,
        role: Role.CREATOR,
      },
    });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.collaboration.sendInvitation({
        seriesId: series.id,
        receiverId: coCreatorUser2.id,
        role: "Colorist",
        shareRatio: 20,
      })
    ).rejects.toThrow("Only the primary creator of this series can send invitations");
  });

  it("fails to send an invitation to a user without a vetted creator profile", async () => {
    const ctx = await createTRPCContext({
      session: {
        userId: primaryUser.id,
        email: primaryUser.email,
        role: Role.CREATOR,
      },
    });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.collaboration.sendInvitation({
        seriesId: series.id,
        receiverId: normalUser.id,
        role: "Illustrator",
        shareRatio: 30,
      })
    ).rejects.toThrow("Collaboration invitations may only be sent to verified and registered creator accounts");
  });

  it("sends an invitation successfully with correct validation", async () => {
    const ctx = await createTRPCContext({
      session: {
        userId: primaryUser.id,
        email: primaryUser.email,
        role: Role.CREATOR,
      },
    });
    const caller = appRouter.createCaller(ctx);

    const invite = await caller.collaboration.sendInvitation({
      seriesId: series.id,
      receiverId: coCreatorUser.id,
      role: "Illustrator",
      roleDescription: "Drawing all main panels and lineart",
      shareRatio: 35,
      message: "Hey, join my project!",
      terms: "Deliver 2 chapters weekly",
    });

    expect(invite).toBeDefined();
    expect(invite.status).toBe("PENDING");
    expect(invite.shareRatio).toBe(35);
    expect(invite.role).toBe("Illustrator");

    // Verify audit log exists
    const audit = await prisma.collaborationAuditLog.findFirst({
      where: { seriesId: series.id, action: "INVITATION_SENT" },
    });
    expect(audit).toBeDefined();
    expect(JSON.parse(audit!.details).role).toBe("Illustrator");
  });

  it("prevents sending duplicate pending invitations", async () => {
    const ctx = await createTRPCContext({
      session: {
        userId: primaryUser.id,
        email: primaryUser.email,
        role: Role.CREATOR,
      },
    });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.collaboration.sendInvitation({
        seriesId: series.id,
        receiverId: coCreatorUser.id,
        role: "Illustrator",
        shareRatio: 10,
      })
    ).rejects.toThrow("A pending invitation already exists for this creator");
  });

  it("prevents sending invitation if proposed splits exceed remaining allocation", async () => {
    const ctx = await createTRPCContext({
      session: {
        userId: primaryUser.id,
        email: primaryUser.email,
        role: Role.CREATOR,
      },
    });
    const caller = appRouter.createCaller(ctx);

    // Existing pending is 35%. Adding 70% would make 105%.
    await expect(
      caller.collaboration.sendInvitation({
        seriesId: series.id,
        receiverId: coCreatorUser2.id,
        role: "Colorist",
        shareRatio: 70,
      })
    ).rejects.toThrow("exceed the remaining available revenue split");
  });

  it("allows receiver to decline a pending invitation", async () => {
    // First, let's send an invitation to coCreatorUser2 so we can decline it
    const primaryCtx = await createTRPCContext({
      session: {
        userId: primaryUser.id,
        email: primaryUser.email,
        role: Role.CREATOR,
      },
    });
    const primaryCaller = appRouter.createCaller(primaryCtx);

    const invite = await primaryCaller.collaboration.sendInvitation({
      seriesId: series.id,
      receiverId: coCreatorUser2.id,
      role: "Colorist",
      shareRatio: 15,
    });

    // Decline invitation
    const receiverCtx = await createTRPCContext({
      session: {
        userId: coCreatorUser2.id,
        email: coCreatorUser2.email,
        role: Role.CREATOR,
      },
    });
    const receiverCaller = appRouter.createCaller(receiverCtx);

    const declinedInvite = await receiverCaller.collaboration.respondToInvitation({
      invitationId: invite.id,
      response: "DECLINE",
    });

    expect(declinedInvite.status).toBe("DECLINED");

    // Verify audit log
    const audit = await prisma.collaborationAuditLog.findFirst({
      where: { seriesId: series.id, action: "INVITATION_DECLINED" },
    });
    expect(audit).toBeDefined();
  });

  it("allows receiver to accept a pending invitation and updates active splits", async () => {
    // Find the pending invitation sent to coCreatorUser (35% ratio)
    const invite = await prisma.collaborationInvitation.findFirst({
      where: {
        seriesId: series.id,
        receiverId: coCreatorUser.id,
        status: "PENDING",
      },
    });
    expect(invite).toBeDefined();

    const receiverCtx = await createTRPCContext({
      session: {
        userId: coCreatorUser.id,
        email: coCreatorUser.email,
        role: Role.CREATOR,
      },
    });
    const receiverCaller = appRouter.createCaller(receiverCtx);

    const acceptedInvite = await receiverCaller.collaboration.respondToInvitation({
      invitationId: invite!.id,
      response: "ACCEPT",
    });

    expect(acceptedInvite.status).toBe("ACCEPTED");

    // Check co-creator's collaboration entry
    const newCollab = await prisma.collaboration.findUnique({
      where: {
        seriesId_userId: {
          seriesId: series.id,
          userId: coCreatorUser.id,
        },
      },
    });
    expect(newCollab).toBeDefined();
    expect(newCollab!.shareRatio).toBe(35);
    expect(newCollab!.role).toBe("Illustrator");

    // Check primary creator's collaboration entry has been adjusted: 100 - 35 = 65%
    const primaryCollab = await prisma.collaboration.findUnique({
      where: {
        seriesId_userId: {
          seriesId: series.id,
          userId: primaryUser.id,
        },
      },
    });
    expect(primaryCollab).toBeDefined();
    expect(primaryCollab!.shareRatio).toBe(65);

    // Verify audit log
    const audit = await prisma.collaborationAuditLog.findFirst({
      where: { seriesId: series.id, action: "INVITATION_ACCEPTED" },
    });
    expect(audit).toBeDefined();
  });

  it("allows primary creator to cancel a pending invitation", async () => {
    // Send new invitation
    const primaryCtx = await createTRPCContext({
      session: {
        userId: primaryUser.id,
        email: primaryUser.email,
        role: Role.CREATOR,
      },
    });
    const primaryCaller = appRouter.createCaller(primaryCtx);

    const invite = await primaryCaller.collaboration.sendInvitation({
      seriesId: series.id,
      receiverId: coCreatorUser2.id,
      role: "Studio Assistant",
      shareRatio: 5,
    });

    // Cancel invitation
    const cancelledInvite = await primaryCaller.collaboration.cancelInvitation({
      invitationId: invite.id,
    });

    expect(cancelledInvite.status).toBe("CANCELLED");

    // Verify audit log
    const audit = await prisma.collaborationAuditLog.findFirst({
      where: { seriesId: series.id, action: "INVITATION_CANCELLED" },
    });
    expect(audit).toBeDefined();
  });
});
