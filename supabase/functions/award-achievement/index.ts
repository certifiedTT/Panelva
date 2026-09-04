// Supabase Edge Function: award-achievement
// Purpose: Creator milestones engine (view milestones, subscriber badges, reward grants)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AchievementRequest {
  creatorId: string;
  milestoneKey: "VIEWS_100K" | "VIEWS_1M" | "SUBSCRIBERS_1K" | "CHAPTERS_50";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { creatorId, milestoneKey }: AchievementRequest = await req.json();

    if (!creatorId || !milestoneKey) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters (creatorId, milestoneKey)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const badgeMap: Record<string, { title: string; bonusCoins: number }> = {
      VIEWS_100K: { title: "Centurion Creator", bonusCoins: 250 },
      VIEWS_1M: { title: "Million Views Milestone", bonusCoins: 1000 },
      SUBSCRIBERS_1K: { title: "Community Pillar", bonusCoins: 500 },
      CHAPTERS_50: { title: "Master Chronicler", bonusCoins: 750 },
    };

    const award = badgeMap[milestoneKey] || { title: "Platform Pioneer", bonusCoins: 100 };

    return new Response(
      JSON.stringify({
        success: true,
        creatorId,
        milestoneKey,
        badgeTitle: award.title,
        bonusCoinsGranted: award.bonusCoins,
        awardedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to award achievement" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
