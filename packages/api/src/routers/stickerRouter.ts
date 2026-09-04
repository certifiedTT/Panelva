import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { canUseSticker } from "../services/stickerEntitlementService";
import { TenorGifService } from "../services/tenorGifService";
import { createLedgerEntry } from "../ledger";

export const stickerRouter = router({
  // 1. Get Creator Packs for Marketplace (Free vs Paid segmented tabs)
  getCreatorPacks: publicProcedure
    .input(
      z.object({
        accessType: z.enum(["ALL", "FREE", "PAID"]).default("ALL"),
        search: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        status: "PUBLISHED",
      };

      if (input.accessType === "FREE") {
        where.accessType = "FREE";
      } else if (input.accessType === "PAID") {
        where.accessType = "PAID";
      } else {
        // Exclude membership packs from generic marketplace view per specs:
        // "Membership packs never appear here"
        where.accessType = { in: ["FREE", "PAID"] };
      }

      if (input.search && input.search.trim()) {
        where.OR = [
          { title: { contains: input.search.trim(), mode: "insensitive" } },
          { description: { contains: input.search.trim(), mode: "insensitive" } },
        ];
      }

      const packs = await (ctx.prisma as any).stickerPack.findMany({
        where,
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          stickers: { take: 4 },
        },
      });

      // Enrich with user ownership if authenticated
      const userId = ctx.session?.userId;
      let userPackIds = new Set<string>();

      if (userId) {
        const owned = await (ctx.prisma as any).userPackLibrary.findMany({
          where: { userId },
          select: { packId: true },
        });
        userPackIds = new Set(owned.map((o: any) => o.packId));
      }

      return packs.map((p: any) => ({
        ...p,
        isOwned: userPackIds.has(p.id) || p.accessType === "FREE",
      }));
    }),

  // 2. Get User's Owned Library Packs (My Packs)
  getMyPacks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { subscription: true, role: true },
    });

    const subscription = user?.subscription || "NONE";

    // Fetch directly owned packs
    const libraries = await (ctx.prisma as any).userPackLibrary.findMany({
      where: { userId },
      include: {
        pack: {
          include: {
            stickers: true,
          },
        },
      },
    });

    const ownedPacks = libraries.map((l: any) => ({
      ...l.pack,
      source: l.source,
      expiresAt: l.expiresAt,
    }));

    // If user is PLUS or PREMIUM, also include subscription-exclusive packs
    if (subscription === "PREMIUM" || subscription === "PLUS") {
      const subAccessTypes = subscription === "PREMIUM" ? ["PLUS", "PREMIUM"] : ["PLUS"];
      const subPacks = await (ctx.prisma as any).stickerPack.findMany({
        where: {
          status: "PUBLISHED",
          accessType: { in: subAccessTypes },
        },
        include: {
          stickers: true,
        },
      });

      for (const sp of subPacks) {
        if (!ownedPacks.some((op: any) => op.id === sp.id)) {
          ownedPacks.push({
            ...sp,
            source: subscription,
            expiresAt: null,
          });
        }
      }
    }

    return ownedPacks;
  }),

  // 3. Get Pack Details with Stickers
  getPackDetails: publicProcedure
    .input(z.object({ packId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const pack = await (ctx.prisma as any).stickerPack.findUnique({
        where: { id: input.packId },
        include: {
          stickers: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!pack) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sticker pack not found." });
      }

      const userId = ctx.session?.userId;
      let accessStatus: { allowed: boolean; reason: string } = { allowed: false, reason: "LOCKED" };

      if (pack.accessType === "FREE") {
        accessStatus = { allowed: true, reason: "FREE" };
      } else if (userId && pack.stickers.length > 0) {
        accessStatus = await canUseSticker(ctx.prisma, userId, pack.stickers[0].id);
      }

      return {
        ...pack,
        accessStatus,
      };
    }),

  // 4. Claim a Free Pack
  claimFreePack: protectedProcedure
    .input(z.object({ packId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pack = await (ctx.prisma as any).stickerPack.findUnique({
        where: { id: input.packId },
      });

      if (!pack) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pack not found." });
      }

      if (pack.accessType !== "FREE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This pack is not free." });
      }

      const existing = await (ctx.prisma as any).userPackLibrary.findUnique({
        where: {
          userId_packId: {
            userId: ctx.session.userId,
            packId: input.packId,
          },
        },
      });

      if (existing) {
        return { success: true, message: "Pack already in your library." };
      }

      await (ctx.prisma as any).userPackLibrary.create({
        data: {
          userId: ctx.session.userId,
          packId: input.packId,
          source: "CLAIM",
        },
      });

      return { success: true, message: `Claimed "${pack.title}" successfully!` };
    }),

  // 5. Purchase a Paid Pack with Credits
  purchasePack: protectedProcedure
    .input(z.object({ packId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      const pack = await (ctx.prisma as any).stickerPack.findUnique({
        where: { id: input.packId },
      });
      if (!pack) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pack not found." });
      }

      if (pack.accessType !== "PAID" || pack.price <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pack is not available for purchase." });
      }

      // Check balance
      if (user.wCoinBalance < pack.price) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Insufficient credits. You need ${pack.price.toLocaleString()} Credits to purchase this pack.`,
        });
      }

      // Check existing purchase
      const existing = await (ctx.prisma as any).userPackLibrary.findUnique({
        where: {
          userId_packId: {
            userId,
            packId: pack.id,
          },
        },
      });

      if (existing && existing.source === "PURCHASE") {
        return { success: true, message: "Pack already purchased and owned." };
      }

      // Ledger double-entry transfer from user to creator
      await createLedgerEntry(
        ctx.prisma,
        userId,
        pack.creatorId,
        pack.price,
        "CHAPTER_UNLOCK", // or monetization transfer
        `Purchased Sticker Pack: ${pack.title} (${pack.price} Credits)`
      );

      // Create permanent library entry
      await (ctx.prisma as any).userPackLibrary.upsert({
        where: {
          userId_packId: {
            userId,
            packId: pack.id,
          },
        },
        create: {
          userId,
          packId: pack.id,
          source: "PURCHASE",
        },
        update: {
          source: "PURCHASE",
          expiresAt: null,
        },
      });

      return {
        success: true,
        message: `Purchased "${pack.title}" for ${pack.price} Credits!`,
      };
    }),

  // 6. User Favorites (Individual Stickers & GIFs)
  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    const favorites = await (ctx.prisma as any).favoriteMedia.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Check entitlement status on stickers so UI displays locked overlay if access was lost
    const resolvedFavorites = await Promise.all(
      favorites.map(async (fav: any) => {
        let isLocked = false;
        let lockReason = "FREE";

        if (fav.mediaType === "STICKER") {
          const entitlement = await canUseSticker(ctx.prisma, userId, fav.mediaId);
          isLocked = !entitlement.allowed;
          lockReason = entitlement.reason;
        }

        let parsedMetadata = {};
        try {
          parsedMetadata = JSON.parse(fav.metadata || "{}");
        } catch {
          parsedMetadata = {};
        }

        return {
          id: fav.id,
          mediaType: fav.mediaType,
          mediaId: fav.mediaId,
          provider: fav.provider,
          createdAt: fav.createdAt,
          isLocked,
          lockReason,
          metadata: parsedMetadata,
        };
      })
    );

    return resolvedFavorites;
  }),

  // 7. Toggle Favorite for Sticker or GIF
  toggleFavorite: protectedProcedure
    .input(
      z.object({
        mediaType: z.enum(["STICKER", "GIF"]),
        mediaId: z.string(),
        provider: z.enum(["Panelva", "Tenor"]).default("Panelva"),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;

      const existing = await (ctx.prisma as any).favoriteMedia.findUnique({
        where: {
          userId_mediaType_mediaId: {
            userId,
            mediaType: input.mediaType,
            mediaId: input.mediaId,
          },
        },
      });

      if (existing) {
        await (ctx.prisma as any).favoriteMedia.delete({
          where: { id: existing.id },
        });
        return { favorited: false, message: "Removed from favorites." };
      }

      await (ctx.prisma as any).favoriteMedia.create({
        data: {
          userId,
          mediaType: input.mediaType,
          mediaId: input.mediaId,
          provider: input.provider,
          metadata: JSON.stringify(input.metadata || {}),
        },
      });

      return { favorited: true, message: "Added to favorites! ⭐" };
    }),

  // 8. Recent Media (Stickers & GIFs)
  getRecentMedia: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    // Fetch user's recent comments with attachments
    const recentComments = await ctx.prisma.comment.findMany({
      where: {
        userId,
        OR: [{ stickerId: { not: null } }, { gifId: { not: null } }],
      },
      take: 15,
      orderBy: { createdAt: "desc" },
    });

    const recentPostComments = await ctx.prisma.creatorPostComment.findMany({
      where: {
        userId,
        OR: [{ stickerId: { not: null } }, { gifId: { not: null } }],
      },
      take: 15,
      orderBy: { createdAt: "desc" },
    });

    const combined = [...recentComments, ...recentPostComments].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const seen = new Set<string>();
    const recents: any[] = [];

    for (const c of combined) {
      if (c.stickerId && !seen.has(`s-${c.stickerId}`)) {
        seen.add(`s-${c.stickerId}`);
        recents.push({
          type: "STICKER",
          id: c.stickerId,
          provider: "Panelva",
        });
      } else if (c.gifId && !seen.has(`g-${c.gifId}`)) {
        seen.add(`g-${c.gifId}`);
        recents.push({
          type: "GIF",
          id: c.gifId,
          url: c.gifUrl,
          provider: "Tenor",
        });
      }
      if (recents.length >= 20) break;
    }

    return recents;
  }),

  // 9. Tenor GIF Search & Trending
  searchGifs: publicProcedure
    .input(z.object({ query: z.string().default(""), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        return await TenorGifService.getTrending(input.limit);
      }
      return await TenorGifService.search(input.query, input.limit);
    }),

  getTrendingGifs: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      return await TenorGifService.getTrending(input.limit);
    }),

  // 10. Check Entitlement Permission directly
  checkStickerAccess: publicProcedure
    .input(z.object({ stickerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await canUseSticker(ctx.prisma, ctx.session?.userId, input.stickerId);
    }),
});
