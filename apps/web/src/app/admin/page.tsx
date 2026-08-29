import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";
import { isAdminRole } from "../../lib/roleUtils";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  const cookieStore = cookies();
  const supabase = createClient(await cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    redirect("/auth?next=/admin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser || !isAdminRole(dbUser.role)) {
    redirect("/");
  }

  return <AdminDashboardClient />;
}
