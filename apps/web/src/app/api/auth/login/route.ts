import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";
import { z } from "zod";

const logInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

  if (origin) {
    try {
      const url = new URL(origin);
      if (!isAuthorizedHost(url.host)) return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const url = new URL(referer);
      if (!isAuthorizedHost(url.host)) return false;
    } catch {
      return false;
    }
  }

  if (host) {
    if (!isAuthorizedHost(host)) return false;
  }

  return true;
};

export async function POST(request: Request) {
  try {
    if (!isRequestAuthorized(request)) {
      return NextResponse.json({ status: "fail", error: "Unauthorized access: CSRF validation failed" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password } = logInSchema.parse(body);

    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ status: "fail", error: authError?.message || "Auth failed" }, { status: 400 });
    }

    // Retrieve the database user record
    const dbUser = await prisma.user.findUnique({
      where: { email: authData.user.email! },
    });

    if (!dbUser) {
      return NextResponse.json({ status: "fail", error: "User profile not found in database" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      data: authData.user,
      username: dbUser.username,
      role: dbUser.role,
      accessToken: authData.session?.access_token,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
