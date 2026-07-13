import { initTRPC, TRPCError } from "@trpc/server";
import { TRPCContext } from "./context";
import { Role } from "@panelva/db";

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const middleware = t.middleware;

// Public Procedure (e.g. Reading Free chapters, browsing)
export const publicProcedure = t.procedure;

// Authenticated User Procedure
export const protectedProcedure = t.procedure.use(({ ctx, next, rawInput }) => {
  if (!ctx.session || !ctx.session.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User session is invalid" });
  }

  // Restrict users to data associated exclusively with their unique UUID
  if (rawInput && typeof rawInput === "object" && "userId" in rawInput) {
    const inputUserId = (rawInput as any).userId;
    const isSelf = inputUserId === ctx.session.userId;
    const isAdmin = ctx.session.role === Role.ADMIN || ctx.session.role === Role.MASTER_ADMIN;

    if (!isSelf && !isAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied: Users are restricted to data associated exclusively with their unique UUID",
      });
    }
  }

  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

// Admin-Only Procedure (Vetting queue access, payouts)
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.session.role;
  if (role !== Role.ADMIN && role !== Role.MASTER_ADMIN) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient administrative roles" });
  }
  return next();
});

// Creator-Only Procedure (Studio uploads)
export const creatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.role !== Role.CREATOR && ctx.session.role !== Role.MASTER_ADMIN) {
    throw new TRPCError({ code: "FORBIDDEN", message: "User is not a verified creator" });
  }
  return next();
});
