import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@panelva/api";
import { prisma, Role, SubscriptionTier } from "@panelva/db";

const isRequestAuthorized = (req: Request): boolean => {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const authorizedDomains = ["localhost:3000", "127.0.0.1:3000"];

  // 1. Check Origin header (CORS requests)
  if (origin) {
    try {
      const url = new URL(origin);
      if (!authorizedDomains.includes(url.host)) {
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
      if (!authorizedDomains.includes(url.host)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // 3. Check Host header
  if (host) {
    if (!authorizedDomains.includes(host)) {
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

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      // Resolve the session from client request headers
      const username = req.headers.get("x-user-username");
      let session = null;

      if (username) {
        // Query the user by username
        let user = await prisma.user.findUnique({
          where: { username },
        });

        // Auto-create user if they do not exist in the database yet
        if (!user) {
          const email = `${username.toLowerCase().replace(/\s+/g, "_")}@panelva.com`;
          
          // Determine the role using the same default heuristics as the Header component
          let role: Role = Role.USER;
          if (username === "notjud3" || username.toLowerCase().includes("master")) {
            role = Role.MASTER_ADMIN;
          } else if (username.toLowerCase().includes("admin") || username === "TO30") {
            role = Role.ADMIN;
          } else if (
            username.toLowerCase().includes("creator") ||
            username.toLowerCase().includes("artist") ||
            username.toLowerCase().includes("author") ||
            username.toLowerCase().includes("novelist")
          ) {
            role = Role.CREATOR;
          }

          try {
            // Check if email already exists to prevent duplication error
            const existingByEmail = await prisma.user.findUnique({ where: { email } });
            if (existingByEmail) {
              user = existingByEmail;
            } else {
              user = await prisma.user.create({
                data: {
                  username,
                  email,
                  role,
                  subscription: SubscriptionTier.NONE,
                  wCoinBalance: 500, // Gift mock coins for testing early-access unlocks
                },
              });
            }
          } catch (e) {
            console.error("Failed to auto-create user session: ", e);
          }
        }

        if (user) {
          session = {
            userId: user.id,
            email: user.email,
            role: user.role as Role,
          };
        }
      }

      return createTRPCContext({ session });
    },
  });
};

export { handler as GET, handler as POST };
