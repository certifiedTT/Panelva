import { prisma, UserRole } from "@panelva/db";

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
}

export interface createContextOptions {
  session: UserSession | null;
}

export async function createTRPCContext(opts: createContextOptions) {
  return {
    session: opts.session,
    prisma,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
