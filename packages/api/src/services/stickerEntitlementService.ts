import { PrismaClient } from "@panelva/db";

export type EntitlementReason =
  | "FREE"
  | "PURCHASED"
  | "MEMBERSHIP"
  | "PLUS"
  | "PREMIUM"
  | "LOCKED";

export interface StickerEntitlementResult {
  allowed: boolean;
  reason: EntitlementReason;
  pack?: {
    id: string;
    creatorId: string;
    title: string;
    accessType: string;
    price: number;
  };
}

/**
 * Resolves whether a user can use a specific sticker based on:
 * - Free packs: allowed for everyone
 * - UserPackLibrary: permanent purchase or active claim
 * - Panelva Subscription (Plus / Premium): unlocks Plus and Premium exclusive packs
 * - Creator Membership: unlocks packs published under creator's membership tiers if subscription is active
 */
export async function canUseSticker(
  prisma: PrismaClient,
  userId: string | null | undefined,
  stickerId: string
): Promise<StickerEntitlementResult> {
  // If stickerId is a fallback static sticker (e.g. from built-in catalog), allow
  if (!stickerId || stickerId.startsWith("t-") || stickerId.startsWith("a-") || stickerId.startsWith("f-") || stickerId.startsWith("l-") || stickerId.startsWith("r-") || stickerId.startsWith("h-") || stickerId.startsWith("p-")) {
    return { allowed: true, reason: "FREE" };
  }

  // Find sticker and its parent pack
  const sticker = await (prisma as any).sticker.findUnique({
    where: { id: stickerId },
    include: {
      pack: true,
    },
  });

  if (!sticker || !sticker.pack) {
    // If not found in db, fallback to FREE for compatibility
    return { allowed: true, reason: "FREE" };
  }

  const pack = sticker.pack;

  // Rule 1: Free packs are available to everyone
  if (pack.accessType === "FREE") {
    return {
      allowed: true,
      reason: "FREE",
      pack: {
        id: pack.id,
        creatorId: pack.creatorId,
        title: pack.title,
        accessType: pack.accessType,
        price: pack.price,
      },
    };
  }

  // If user is not logged in and pack is not free, locked
  if (!userId) {
    return {
      allowed: false,
      reason: "LOCKED",
      pack: {
        id: pack.id,
        creatorId: pack.creatorId,
        title: pack.title,
        accessType: pack.accessType,
        price: pack.price,
      },
    };
  }

  // Rule 2: Check UserPackLibrary for direct ownership (Purchase or Claim)
  const libraryEntry = await (prisma as any).userPackLibrary.findUnique({
    where: {
      userId_packId: {
        userId,
        packId: pack.id,
      },
    },
  });

  if (libraryEntry) {
    // Permanent purchase
    if (libraryEntry.source === "PURCHASE") {
      return {
        allowed: true,
        reason: "PURCHASED",
        pack: {
          id: pack.id,
          creatorId: pack.creatorId,
          title: pack.title,
          accessType: pack.accessType,
          price: pack.price,
        },
      };
    }

    // Claimed free pack
    if (libraryEntry.source === "CLAIM") {
      return {
        allowed: true,
        reason: "FREE",
        pack: {
          id: pack.id,
          creatorId: pack.creatorId,
          title: pack.title,
          accessType: pack.accessType,
          price: pack.price,
        },
      };
    }

    // Check expiration if recorded
    if (libraryEntry.expiresAt && new Date(libraryEntry.expiresAt) < new Date()) {
      // Expired membership or timed grant
      return {
        allowed: false,
        reason: "LOCKED",
        pack: {
          id: pack.id,
          creatorId: pack.creatorId,
          title: pack.title,
          accessType: pack.accessType,
          price: pack.price,
        },
      };
    }
  }

  // Rule 3: Check User Subscription (PLUS / PREMIUM)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscription: true, role: true },
  });

  const subscription = user?.subscription || "NONE";
  const isMasterAdmin = user?.role === "MASTER_ADMIN" || user?.role === "ADMIN";

  if (isMasterAdmin) {
    return {
      allowed: true,
      reason: "PREMIUM",
      pack: {
        id: pack.id,
        creatorId: pack.creatorId,
        title: pack.title,
        accessType: pack.accessType,
        price: pack.price,
      },
    };
  }

  // Premium includes Plus packs automatically
  if (subscription === "PREMIUM") {
    if (pack.accessType === "PREMIUM" || pack.accessType === "PLUS" || pack.accessType === "FREE") {
      return {
        allowed: true,
        reason: "PREMIUM",
        pack: {
          id: pack.id,
          creatorId: pack.creatorId,
          title: pack.title,
          accessType: pack.accessType,
          price: pack.price,
        },
      };
    }
  } else if (subscription === "PLUS") {
    if (pack.accessType === "PLUS" || pack.accessType === "FREE") {
      return {
        allowed: true,
        reason: "PLUS",
        pack: {
          id: pack.id,
          creatorId: pack.creatorId,
          title: pack.title,
          accessType: pack.accessType,
          price: pack.price,
        },
      };
    }
  }

  // Rule 4: Check Creator Membership exclusive packs
  if (pack.accessType === "MEMBERSHIP") {
    // Check if user has an active membership subscription to this creator
    const creatorProfile = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ id: pack.creatorId }, { userId: pack.creatorId }],
      },
      include: {
        membershipTiers: {
          include: {
            subscriptions: {
              where: {
                userId,
                status: "ACTIVE",
                currentPeriodEnd: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    const hasActiveMembership =
      creatorProfile?.membershipTiers?.some(
        (tier: any) => tier.subscriptions && tier.subscriptions.length > 0
      ) || false;

    if (hasActiveMembership) {
      return {
        allowed: true,
        reason: "MEMBERSHIP",
        pack: {
          id: pack.id,
          creatorId: pack.creatorId,
          title: pack.title,
          accessType: pack.accessType,
          price: pack.price,
        },
      };
    }
  }

  // Otherwise, user does not have permission
  return {
    allowed: false,
    reason: "LOCKED",
    pack: {
      id: pack.id,
      creatorId: pack.creatorId,
      title: pack.title,
      accessType: pack.accessType,
      price: pack.price,
    },
  };
}
