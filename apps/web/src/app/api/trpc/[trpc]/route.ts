import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@panelva/api";
import { prisma } from "@panelva/db";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Simple in-memory rate limiter for tRPC endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const limitInfo = rateLimitMap.get(ip);
  if (!limitInfo || now > limitInfo.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  if (limitInfo.count >= MAX_REQUESTS) {
    return true;
  }
  limitInfo.count += 1;
  return false;
};
const isRequestAuthorized = (req: Request): boolean => {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const isAuthorizedHost = (h: string | null): boolean => {
    if (!h) return false;
    if (h === "localhost:3000" || h === "127.0.0.1:3000") return true;
    if (h.endsWith(".vercel.app")) return true;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      try {
        const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
        if (h === siteUrl.host) return true;
      } catch {}
    }
    return false;
  };

  // 1. Check Origin header (CORS requests)
  if (origin) {
    try {
      const url = new URL(origin);
      if (!isAuthorizedHost(url.host)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // 2. Check Referer header
  if (referer) {
    try {
      const url = new URL(referer);
      if (!isAuthorizedHost(url.host)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // 3. Check Host header
  if (host) {
    if (!isAuthorizedHost(host)) {
      return false;
    }
  }

  return true;
};

const handler = async (req: Request) => {
  if (!isRequestAuthorized(req)) {
    return new Response(
      JSON.stringify({
        error: {
          message: "API access restricted to authorized domain",
        },
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({
        error: {
          message: "Too many requests. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      let session = null;

      try {
        const cookieStore = cookies();
        const supabase = createClient(await cookieStore);

        const { data: { user }, error } = await supabase.auth.getUser();

        if (user && user.email) {
          // Verify user exists in the Prisma database and fetch their role
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            session = {
              userId: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
            };
          }
        }
      } catch (e) {
        console.error("Failed to authenticate session with Supabase:", e);
      }

      return createTRPCContext({ session });
    },
  });
};

export { handler as GET, handler as POST };
