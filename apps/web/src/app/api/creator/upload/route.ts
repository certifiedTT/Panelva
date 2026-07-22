import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma, UserRole } from "@panelva/db";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(await cookieStore);

    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json({ status: "fail", error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user || (user.role !== UserRole.CREATOR && user.role !== UserRole.ADMIN && user.role !== UserRole.MASTER_ADMIN)) {
      return NextResponse.json({ status: "fail", error: "Forbidden. Requires CREATOR or ADMIN role." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ status: "fail", error: "No file provided" }, { status: 400 });
    }

    const fileName = `creator_assets/${authUser.id}_${Date.now()}_${file.name}`;

    const { data, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, file);

    if (uploadError) {
       return NextResponse.json({ status: "fail", error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName);

    return NextResponse.json({ status: "success", data: { url: publicUrlData.publicUrl } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
