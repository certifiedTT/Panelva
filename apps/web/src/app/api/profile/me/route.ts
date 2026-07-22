import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ status: "fail", error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        creatorProfiles: true,
      }
    });

    if (!profile) {
      return NextResponse.json({ status: "fail", error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", data: profile }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
