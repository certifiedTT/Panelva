import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma, CreatorType } from "@panelva/db";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ status: "fail", error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const application = await prisma.creatorApplication.create({
      data: {
        userId: authUser.id,
        type: body.type as CreatorType,
        penName: body.penName,
        portfolioUrl: body.portfolioUrl,
        bio: body.bio,
      }
    });

    return NextResponse.json({ status: "success", data: application }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
