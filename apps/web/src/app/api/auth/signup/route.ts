import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = signUpSchema.parse(body);

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
      }
    });

    return NextResponse.json({ status: "success", data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
