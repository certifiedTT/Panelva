import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@panelva/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createClient(await cookieStore);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          // Find or create user in Prisma database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
          });

          if (!dbUser) {
            let baseUsername = user.email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "");
            if (baseUsername.length < 3) {
              baseUsername = "user_" + baseUsername;
            }
            // Ensure unique username
            let username = baseUsername;
            let counter = 1;
            while (true) {
              const existing = await prisma.user.findUnique({
                where: { username },
              });
              if (!existing) break;
              username = `${baseUsername}_${counter}`;
              counter++;
            }

            await prisma.user.create({
              data: {
                id: user.id,
                email: user.email,
                username,
                wCoinBalance: 0,
                emailVerified: !!user.email_confirmed_at,
              },
            });
          } else {
            if (user.email_confirmed_at && !dbUser.emailVerified) {
              await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true },
              });
            }
          }
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error("OAuth callback error:", err);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=OAuth authentication failed`);
}
