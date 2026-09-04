import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { sendGift } from "../ledger";

export const postRouter = router({
  // 1. Create a post (Creator only)
  createPost: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string(),
      type: z.string().default("TEXT"),
      visibility: z.string().default("PUBLIC"),
      allowedTierId: z.string().uuid().nullable().optional(),
      mediaUrls: z.array(z.string()).default([]),
      pollOptions: z.array(z.string()).default([]),
      status: z.string().default("PUBLISHED"),
      scheduledFor: z.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Resolve creator profile
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only registered creators can create posts." });
      }

      return await ctx.prisma.creatorPost.create({
        data: {
          creatorProfileId: creator.id,
          title: input.title,
          content: input.content,
          type: input.type,
          visibility: input.visibility,
          allowedTierId: input.allowedTierId || null,
          mediaUrls: JSON.stringify(input.mediaUrls),
          pollOptions: JSON.stringify(input.pollOptions),
          status: input.status,
          scheduledFor: input.scheduledFor || null,
        }
      });
    }),

  // 2. Update a post (Creator only)
  updatePost: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      type: z.string().optional(),
      visibility: z.string().optional(),
      allowedTierId: z.string().uuid().nullable().optional(),
      mediaUrls: z.array(z.string()).optional(),
      pollOptions: z.array(z.string()).optional(),
      status: z.string().optional(),
      scheduledFor: z.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only creators can edit posts." });
      }

      const post = await ctx.prisma.creatorPost.findUnique({
        where: { id: input.postId }
      });
      if (!post || post.creatorProfileId !== creator.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found or unauthorized." });
      }

      const data: any = { ...input };
      delete data.postId;
      if (input.mediaUrls) data.mediaUrls = JSON.stringify(input.mediaUrls);
      if (input.pollOptions) data.pollOptions = JSON.stringify(input.pollOptions);

      return await ctx.prisma.creatorPost.update({
        where: { id: input.postId },
        data
      });
    }),

  // 3. Delete a post (Creator only)
  deletePost: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only creators can delete posts." });
      }

      const post = await ctx.prisma.creatorPost.findUnique({
        where: { id: input.postId }
      });
      if (!post || post.creatorProfileId !== creator.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found or unauthorized." });
      }

      return await ctx.prisma.creatorPost.delete({
        where: { id: input.postId }
      });
    }),

  // 4. Toggle Pin/Unpin (Creator only)
  togglePinPost: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only creators can pin posts." });
      }

      const post = await ctx.prisma.creatorPost.findUnique({
        where: { id: input.postId }
      });
      if (!post || post.creatorProfileId !== creator.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found or unauthorized." });
      }

      // If pinning, unpin other pinned posts from this creator
      if (!post.isPinned) {
        await ctx.prisma.creatorPost.updateMany({
          where: { creatorProfileId: creator.id, isPinned: true },
          data: { isPinned: false }
        });
      }

      return await ctx.prisma.creatorPost.update({
        where: { id: input.postId },
        data: { isPinned: !post.isPinned }
      });
    }),

  // 5. Get Creator Posts (Studio management)
  getCreatorPosts: protectedProcedure
    .query(async ({ ctx }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Creator profile not active." });
      }

      return await ctx.prisma.creatorPost.findMany({
        where: { creatorProfileId: creator.id },
        include: {
          comments: true,
          likes: true,
          bookmarks: true,
        },
        orderBy: { createdAt: "desc" }
      });
    }),

  // 6. Get Public Creator Posts (Creator public profile tab)
  getPublicCreatorPosts: publicProcedure
    .input(z.object({
      creatorProfileId: z.string().uuid(),
      currentUserId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { creatorProfileId, currentUserId } = input;

      const posts = await ctx.prisma.creatorPost.findMany({
        where: { 
          creatorProfileId,
          status: "PUBLISHED"
        },
        include: {
          creatorProfile: true,
          comments: {
            include: { user: true }
          },
          likes: true,
          bookmarks: true,
        },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "desc" }
        ]
      });

      // Filter and hide locked content if viewer is not allowed
      return await evaluatePostVisibility(ctx.prisma, posts, currentUserId || null, creatorProfileId);
    }),

  // 7. Get Creator Hub feed for reader (Discover, following, featured)
  getHubFeed: publicProcedure
    .input(z.object({
      tab: z.enum(["discover", "following", "featured", "trending", "latest", "chronological"]).default("discover"),
      currentUserId: z.string().uuid().optional(),
      cursor: z.string().uuid().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { tab, currentUserId, limit, cursor } = input;

      let whereClause: any = { status: "PUBLISHED" };

      // Handle "following" tab
      if (tab === "following") {
        if (!currentUserId) return { items: [], nextCursor: undefined };
        const followed = await ctx.prisma.creatorFollow.findMany({
          where: { userId: currentUserId },
          select: { creatorProfileId: true }
        });
        const followedIds = followed.map(f => f.creatorProfileId);
        whereClause.creatorProfileId = { in: followedIds };
      }

      // Handle "featured" tab
      if (tab === "featured") {
        whereClause.creatorProfile = { isFeatured: true };
      }

      // Pagination cursor
      if (cursor) {
        whereClause.id = { not: cursor };
      }

      let orderBy: any = { createdAt: "desc" };
      if (tab === "discover" || tab === "trending") {
        orderBy = [
          { viewsCount: "desc" },
          { createdAt: "desc" }
        ];
      }

      const posts = await ctx.prisma.creatorPost.findMany({
        where: whereClause,
        take: limit + 1,
        include: {
          creatorProfile: true,
          comments: {
            include: { user: true }
          },
          likes: true,
          bookmarks: true,
        },
        orderBy
      });

      let hasMore = false;
      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        hasMore = true;
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      const processed = await evaluatePostVisibility(ctx.prisma, posts, currentUserId || null, null);

      return {
        items: processed,
        nextCursor
      };
    }),

  // 8. Follow / Unfollow Creator
  followCreator: protectedProcedure
    .input(z.object({ creatorProfileId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const { creatorProfileId } = input;

      // Verify creator profile exists
      const creator = await ctx.prisma.creatorProfile.findUnique({
        where: { id: creatorProfileId }
      });
      if (!creator) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Creator profile not found." });
      }

      const existing = await ctx.prisma.creatorFollow.findUnique({
        where: {
          userId_creatorProfileId: { userId, creatorProfileId }
        }
      });

      if (existing) {
        // Unfollow
        await ctx.prisma.creatorFollow.delete({
          where: { id: existing.id }
        });

        // Decrement followerCount
        await ctx.prisma.creatorProfile.update({
          where: { id: creatorProfileId },
          data: { followerCount: { decrement: 1 } }
        });

        return { followed: false };
      } else {
        // Follow
        await ctx.prisma.creatorFollow.create({
          data: { userId, creatorProfileId }
        });

        // Increment followerCount
        await ctx.prisma.creatorProfile.update({
          where: { id: creatorProfileId },
          data: { followerCount: { increment: 1 } }
        });

        // Add reader notification
        await ctx.prisma.creatorNotification.create({
          data: {
            creatorProfileId,
            userId,
            title: "New Follower",
            message: `@${ctx.session.email.split("@")[0]} followed your profile.`,
            type: "SOCIAL"
          }
        });

        return { followed: true };
      }
    }),

  // 9. Is Following Creator check
  isFollowingCreator: protectedProcedure
    .input(z.object({ creatorProfileId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.creatorFollow.findUnique({
        where: {
          userId_creatorProfileId: {
            userId: ctx.session.userId,
            creatorProfileId: input.creatorProfileId
          }
        }
      });
      return !!existing;
    }),

  // 10. Toggle Like on a Post
  likePost: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const { postId } = input;

      const existing = await ctx.prisma.creatorPostLike.findUnique({
        where: {
          postId_userId: { postId, userId }
        }
      });

      if (existing) {
        await ctx.prisma.creatorPostLike.delete({
          where: {
            postId_userId: { postId, userId }
          }
        });
        return { liked: false };
      } else {
        await ctx.prisma.creatorPostLike.create({
          data: { postId, userId }
        });

        // Incremental views count on like
        await ctx.prisma.creatorPost.update({
          where: { id: postId },
          data: { viewsCount: { increment: 1 } }
        });

        return { liked: true };
      }
    }),

  // 11. Toggle Bookmark on a Post
  bookmarkPost: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.userId;
      const { postId } = input;

      const existing = await ctx.prisma.creatorPostBookmark.findUnique({
        where: {
          postId_userId: { postId, userId }
        }
      });

      if (existing) {
        await ctx.prisma.creatorPostBookmark.delete({
          where: {
            postId_userId: { postId, userId }
          }
        });
        return { bookmarked: false };
      } else {
        await ctx.prisma.creatorPostBookmark.create({
          data: { postId, userId }
        });
        return { bookmarked: true };
      }
    }),

  // 12. Add a Comment (with Sticker, GIF & Gift support)
  addComment: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      content: z.string().max(1000).default(""),
      parentId: z.string().uuid().nullable().optional(),
      stickerId: z.string().optional().nullable(),
      gifId: z.string().optional().nullable(),
      gifUrl: z.string().optional().nullable(),
      giftId: z.string().optional().nullable(),
      giftCredits: z.number().int().min(0).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasContent = input.content && input.content.trim().length > 0;
      const hasAttachment = Boolean(input.stickerId || input.gifId);
      if (!hasContent && !hasAttachment) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Comment cannot be empty." });
      }

      // Enforce single attachment rule
      if (input.stickerId && input.gifId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A comment can have at most one attachment (either sticker or GIF).",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.userId }
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User profile not active" });
      }

      // Check sticker entitlement
      if (input.stickerId) {
        const { canUseSticker } = await import("../services/stickerEntitlementService");
        const access = await canUseSticker(ctx.prisma, user.id, input.stickerId);
        if (!access.allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this sticker pack.",
          });
        }
      }

      // Handle gift deduction if user sent a gift with comment
      const giftCredits = input.giftCredits || 0;
      let giftTier: 0 | 1 | 2 | 3 = 0;

      if (giftCredits > 0) {
        if (user.wCoinBalance < giftCredits) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Insufficient credits. You need ${giftCredits} Credits to send this gift.`,
          });
        }

        if (giftCredits >= 10000) giftTier = 3;
        else if (giftCredits >= 5000) giftTier = 2;
        else if (giftCredits >= 2000) giftTier = 1;

        const post = await ctx.prisma.creatorPost.findUnique({
          where: { id: input.postId },
          include: { creatorProfile: true }
        });

        if (post) {
          const { createLedgerEntry } = await import("../ledger");
          await createLedgerEntry(
            ctx.prisma,
            user.id,
            post.creatorProfile.userId,
            giftCredits,
            "CHAPTER_UNLOCK",
            `Gift sent: ${input.giftId || "Gift"} (${giftCredits} Credits) to creator post ${post.title}`,
          );
        }
      }

      // Prevent duplicate comment spam
      const finalContent = input.content ? input.content.trim() : (input.stickerId ? "[Sticker]" : "[GIF]");
      const duplicateComment = await ctx.prisma.creatorPostComment.findFirst({
        where: {
          postId: input.postId,
          userId: ctx.session.userId,
          content: finalContent,
        }
      });
      if (duplicateComment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate comment detected on this post.",
        });
      }

      const created = await ctx.prisma.creatorPostComment.create({
        data: {
          postId: input.postId,
          userId: ctx.session.userId,
          content: finalContent,
          parentId: input.parentId || null,
          stickerId: input.stickerId || null,
          gifId: input.gifId || null,
          gifUrl: input.gifUrl || null,
          giftId: input.giftId || null,
          giftCredits: giftCredits,
          giftTier: giftTier,
        },
        include: {
          user: true
        }
      });

      return {
        ...created,
        reputationAwarded: 5,
      };
    }),

  // 13. Delete a Comment (User owns it or Creator owns post)
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.creatorPostComment.findUnique({
        where: { id: input.commentId },
        include: { post: true }
      });
      if (!comment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found." });
      }

      // Creators can delete any comment on their own posts, users can delete their own comments
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });

      const isPostOwner = creator && comment.post.creatorProfileId === creator.id;
      const isCommentOwner = comment.userId === ctx.session.userId;

      if (!isPostOwner && !isCommentOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized deletion." });
      }

      await ctx.prisma.creatorPostComment.delete({
        where: { id: input.commentId }
      });

      return {
        success: true,
        reputationRevoked: 5,
        message: "Comment removed and reputation revoked.",
      };
    }),

  // 14. Creator Pin Comment
  togglePinComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only creators can pin comments." });
      }

      const comment = await ctx.prisma.creatorPostComment.findUnique({
        where: { id: input.commentId },
        include: { post: true }
      });

      if (!comment || comment.post.creatorProfileId !== creator.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found or unauthorized." });
      }

      // Unpin any other comments on this post first
      if (!comment.isPinned) {
        await ctx.prisma.creatorPostComment.updateMany({
          where: { postId: comment.postId, isPinned: true },
          data: { isPinned: false }
        });
      }

      return await ctx.prisma.creatorPostComment.update({
        where: { id: input.commentId },
        data: { isPinned: !comment.isPinned }
      });
    }),

  // 15. Creator Heart Comment
  toggleHeartComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only creators can heart comments." });
      }

      const comment = await ctx.prisma.creatorPostComment.findUnique({
        where: { id: input.commentId },
        include: { post: true }
      });

      if (!comment || comment.post.creatorProfileId !== creator.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found or unauthorized." });
      }

      return await ctx.prisma.creatorPostComment.update({
        where: { id: input.commentId },
        data: { isHearted: !comment.isHearted }
      });
    }),

  // 16. Get Post Comments
  getPostComments: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.creatorPostComment.findMany({
        where: { postId: input.postId },
        include: { user: true },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "asc" }
        ]
      });
    }),

  // 17. Send gift to creator on post
  sendPostGift: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      giftCost: z.number().min(1),
      giftName: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.userId;
      const { postId, giftCost, giftName } = input;

      const post = await ctx.prisma.creatorPost.findUnique({
        where: { id: postId },
        include: { creatorProfile: true }
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }

      const creatorUserId = post.creatorProfile.userId;

      // Transfer credits
      const entry = await sendGift(
        senderId,
        creatorUserId,
        giftCost,
        `Sent gift "${giftName}" on post "${post.title}"`
      );

      // Increment giftsCount on post
      await ctx.prisma.creatorPost.update({
        where: { id: postId },
        data: { giftsCount: { increment: giftCost } }
      });

      // Add Notification
      await ctx.prisma.creatorNotification.create({
        data: {
          creatorProfileId: post.creatorProfileId,
          userId: creatorUserId,
          title: "Received Gift",
          message: `@${ctx.session.email.split("@")[0]} sent a ${giftName} worth ${giftCost} Credits on your post.`,
          type: "PAYMENT"
        }
      });

      return entry;
    }),

  // 18. Send Tip to Creator on post
  sendPostTip: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      amount: z.number().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.userId;
      const { postId, amount } = input;

      const post = await ctx.prisma.creatorPost.findUnique({
        where: { id: postId },
        include: { creatorProfile: true }
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }

      const creatorUserId = post.creatorProfile.userId;

      // Transfer credits
      const entry = await sendGift(
        senderId,
        creatorUserId,
        amount,
        `Tipped ${amount} coins on post "${post.title}"`
      );

      // Increment tipsCount on post
      await ctx.prisma.creatorPost.update({
        where: { id: postId },
        data: { tipsCount: { increment: amount } }
      });

      // Add Notification
      await ctx.prisma.creatorNotification.create({
        data: {
          creatorProfileId: post.creatorProfileId,
          userId: creatorUserId,
          title: "Received Tip",
          message: `@${ctx.session.email.split("@")[0]} tipped you ${amount} Credits on your post.`,
          type: "PAYMENT"
        }
      });

      return entry;
    }),

  // 19. Get Post Analytics (Studio dashboards)
  getPostAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      const creator = await ctx.prisma.creatorProfile.findFirst({
        where: { userId: ctx.session.userId }
      });
      if (!creator) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Creator profile not active." });
      }

      const posts = await ctx.prisma.creatorPost.findMany({
        where: { creatorProfileId: creator.id },
        include: {
          comments: true,
          likes: true,
          bookmarks: true
        }
      });

      // Compute total aggregate stats
      const totalViews = posts.reduce((sum, p) => sum + p.viewsCount, 0);
      const totalLikes = posts.reduce((sum, p) => sum + p.likes.length, 0);
      const totalComments = posts.reduce((sum, p) => sum + p.comments.length, 0);
      const totalBookmarks = posts.reduce((sum, p) => sum + p.bookmarks.length, 0);
      const totalTips = posts.reduce((sum, p) => sum + p.tipsCount, 0);
      const totalGifts = posts.reduce((sum, p) => sum + p.giftsCount, 0);

      // Map posts to dynamic history chart format
      const chartData = posts.slice(0, 10).map(p => ({
        title: p.title.length > 15 ? p.title.substring(0, 15) + "..." : p.title,
        views: p.viewsCount,
        likes: p.likes.length,
        comments: p.comments.length,
        revenue: p.tipsCount + p.giftsCount
      })).reverse();

      return {
        summary: {
          totalViews,
          totalLikes,
          totalComments,
          totalBookmarks,
          totalTips,
          totalGifts,
          totalPosts: posts.length,
        },
        chartData
      };
    }),

  // 22. Vote on a poll post
  castPollVote: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      optionIndex: z.number().int().nonnegative()
    }))
    .mutation(async ({ ctx, input }) => {
      const { postId, optionIndex } = input;

      const post = await ctx.prisma.creatorPost.findUnique({
        where: { id: postId }
      });
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found." });
      }
      if (post.type !== "POLL") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Post is not a poll." });
      }

      const pollVotesList = JSON.parse(post.pollVotes || "[]");
      const pollOptionsList = JSON.parse(post.pollOptions || "[]");

      if (optionIndex >= pollOptionsList.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid option index." });
      }

      while (pollVotesList.length < pollOptionsList.length) {
        pollVotesList.push(0);
      }

      pollVotesList[optionIndex] = (pollVotesList[optionIndex] || 0) + 1;

      return await ctx.prisma.creatorPost.update({
        where: { id: postId },
        data: {
          pollVotes: JSON.stringify(pollVotesList)
        }
      });
    }),

  // 20. Send tip directly to creator profile
  sendCreatorTip: protectedProcedure
    .input(z.object({
      creatorProfileId: z.string().uuid(),
      amount: z.number().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.userId;
      const { creatorProfileId, amount } = input;

      const creator = await ctx.prisma.creatorProfile.findUnique({
        where: { id: creatorProfileId }
      });
      if (!creator) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Creator profile not found." });
      }

      await sendGift(senderId, creator.userId, amount, `Tipped creator profile "${creator.penName}"`);

      // Add Notification
      await ctx.prisma.creatorNotification.create({
        data: {
          creatorProfileId,
          userId: creator.userId,
          title: "Profile Tip Received",
          message: `@${ctx.session.email.split("@")[0]} tipped your profile ${amount} Credits.`,
          type: "PAYMENT"
        }
      });

      return { success: true };
    }),

  // 21. Send gift directly to creator profile
  sendCreatorGift: protectedProcedure
    .input(z.object({
      creatorProfileId: z.string().uuid(),
      giftCost: z.number().min(1),
      giftName: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.userId;
      const { creatorProfileId, giftCost, giftName } = input;

      const creator = await ctx.prisma.creatorProfile.findUnique({
        where: { id: creatorProfileId }
      });
      if (!creator) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Creator profile not found." });
      }

      await sendGift(senderId, creator.userId, giftCost, `Sent gift "${giftName}" to creator profile "${creator.penName}"`);

      // Add Notification
      await ctx.prisma.creatorNotification.create({
        data: {
          creatorProfileId,
          userId: creator.userId,
          title: "Profile Gift Received",
          message: `@${ctx.session.email.split("@")[0]} sent a ${giftName} worth ${giftCost} Credits to your profile.`,
          type: "PAYMENT"
        }
      });

      return { success: true };
    })
});

// Helper: Check visibility locks for a batch of posts
async function evaluatePostVisibility(prismaClient: any, posts: any[], userId: string | null, directCreatorId: string | null) {
  // If viewer is creator of these posts, bypass visibility blocks
  let activeSubs: any[] = [];
  let follows: any[] = [];

  if (userId) {
    activeSubs = await prismaClient.userMembershipSubscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gte: new Date() }
      },
      include: {
        tier: true
      }
    });

    follows = await prismaClient.creatorFollow.findMany({
      where: { userId }
    });
  }

  const followedCreatorIds = follows.map(f => f.creatorProfileId);

  return posts.map(post => {
    let isLocked = false;
    let lockMessage = "";

    const isOwner = userId && post.creatorProfile.userId === userId;

    if (!isOwner) {
      if (post.visibility === "FOLLOWERS_ONLY") {
        const isFollowing = followedCreatorIds.includes(post.creatorProfileId);
        if (!isFollowing) {
          isLocked = true;
          lockMessage = "This post is available for Followers only.";
        }
      } else if (post.visibility === "MEMBERS_ONLY") {
        const isMember = activeSubs.some(sub => sub.tier.creatorProfileId === post.creatorProfileId);
        if (!isMember) {
          isLocked = true;
          lockMessage = "This post is available for Members only.";
        }
      } else if (post.visibility === "TIER_ONLY" && post.allowedTierId) {
        const hasTierAccess = activeSubs.some(sub => sub.tierId === post.allowedTierId);
        if (!hasTierAccess) {
          isLocked = true;
          lockMessage = "This post is restricted to specific membership tier subscribers.";
        }
      }
    }

    const isFollowingCreator = followedCreatorIds.includes(post.creatorProfileId);
    const isLiked = userId ? post.likes.some((l: any) => l.userId === userId) : false;
    const isBookmarked = userId ? post.bookmarks.some((b: any) => b.userId === userId) : false;

    // Clone and strip content if locked
    return {
      ...post,
      content: isLocked ? "" : post.content,
      mediaUrls: isLocked ? "[]" : post.mediaUrls,
      pollOptions: isLocked ? "[]" : post.pollOptions,
      isLocked,
      lockMessage,
      isFollowing: isFollowingCreator,
      isLiked,
      isBookmarked
    };
  });
}
