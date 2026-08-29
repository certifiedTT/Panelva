import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@panelva/api";
import { prisma } from "@panelva/db";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Persistent database-backed rate limiter for tRPC endpoints
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

// In-memory fallback map in case database fails
const fallbackRateLimitMap = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = async (ip: string): Promise<boolean> => {
  const now = new Date();
  const key = `ratelimit:${ip}`;

  try {
    const record = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!record || now > record.resetTime) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW),
        },
        update: {
          count: 1,
          resetTime: new Date(Date.now() + RATE_LIMIT_WINDOW),
        },
      });
      return false;
    }

    if (record.count >= MAX_REQUESTS) {
      return true;
    }

    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: { increment: 1 },
      },
    });
    return false;
  } catch (error) {
    console.error("Rate limiter database error, falling back to in-memory:", error);
    
    // In-memory fallback implementation
    const nowMs = Date.now();
    const limitInfo = fallbackRateLimitMap.get(ip);
    if (!limitInfo || nowMs > limitInfo.resetTime) {
      fallbackRateLimitMap.set(ip, { count: 1, resetTime: nowMs + RATE_LIMIT_WINDOW });
      return false;
    }
    if (limitInfo.count >= MAX_REQUESTS) {
      return true;
    }
    limitInfo.count += 1;
    return false;
  }
};
const isRequestAuthorized = (req: Request): boolean => {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const isAuthorizedHost = (h: string | null): boolean => {
    if (!h) return false;
    
    // In development mode, allow localhost/LAN hosts on any port
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      const hostWithoutPort = h.split(":")[0];
      if (
        hostWithoutPort === "localhost" ||
        hostWithoutPort === "127.0.0.1" ||
        hostWithoutPort.startsWith("192.168.") ||
        hostWithoutPort.startsWith("10.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostWithoutPort)
      ) {
        return true;
      }
    }

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
  if (await isRateLimited(ip)) {
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
        const allCookies = cookieStore.getAll();
        const hasSupabaseCookie = allCookies.some(
          (c) => c.name.includes("auth-token") || c.name.startsWith("sb-")
        );

        const authHeader = req.headers.get("authorization");
        let user = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
          const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
          );
          const { data, error } = await supabase.auth.getUser(token);
          if (data && data.user) {
            user = data.user;
          }
        } else if (hasSupabaseCookie) {
          const supabase = createClient(await cookieStore);
          const { data, error } = await supabase.auth.getUser();
          if (data && data.user) {
            user = data.user;
          }
        }

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


        // Apply dynamic preview role override — ONLY for MASTER_ADMIN sessions
        if (session) {
          const xPreviewRole = req.headers.get("x-preview-role");
          if (xPreviewRole && session.role === "MASTER_ADMIN") {
            session.role = xPreviewRole as any;
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
