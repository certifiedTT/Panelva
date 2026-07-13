import { prisma, Role } from "@panelva/db";

export interface UserSession {
  userId: string;
  email: string;
  role: Role;
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
