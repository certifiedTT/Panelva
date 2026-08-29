import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
  username: z.string().min(3),
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
    const { email, password, username } = signUpSchema.parse(body);

    // Enforce strict username format and constraints
    const formatRegex = /^[a-zA-Z0-9_-]+$/;
    if (!formatRegex.test(username)) {
      return NextResponse.json({ status: "fail", error: "Username can only contain letters, numbers, underscores, and dashes." }, { status: 400 });
    }

    const reserved = [
      "admin", "moderator", "support", "root", "staff", "panelva", 
      "master", "system", "null", "undefined", "finance", "safety", 
      "editorial", "marketing", "partnership", "regional", "creator"
    ];
    if (reserved.includes(username.toLowerCase())) {
      return NextResponse.json({ status: "fail", error: "This username is reserved and cannot be used." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return NextResponse.json({ status: "fail", error: "Username is already taken." }, { status: 400 });
    }

    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ status: "fail", error: authError?.message || "Auth failed" }, { status: 400 });
    }

    // Upsert into our prisma DB
    const user = await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { email, username },
      create: {
        id: authData.user.id,
        email,
        username,
        wCoinBalance: 0,
      }
    });

    return NextResponse.json({ status: "success", data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
