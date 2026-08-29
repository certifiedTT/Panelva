import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  username: z.string().min(3).optional(),
  avatarUrl: z.string().url().optional(),
  realName: z.string().optional(),
  payoutEmail: z.string().email().optional(),
  taxId: z.string().optional(),
});

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ status: "fail", error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates = updateProfileSchema.parse(body);

    if (updates.username) {
      const username = updates.username;

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
      if (existingUser && existingUser.id !== authUser.id) {
        return NextResponse.json({ status: "fail", error: "Username is already taken." }, { status: 400 });
      }
    }

    const profile = await prisma.user.update({
      where: { id: authUser.id },
      data: updates,
    });

    return NextResponse.json({ status: "success", data: profile }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
