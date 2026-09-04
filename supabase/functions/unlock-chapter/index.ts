// Supabase Edge Function: unlock-chapter
// Purpose: Deducts reader credits via ledger and allocates 70% revenue to creator wallet
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnlockRequest {
  userId: string;
  chapterId: string;
  priceCoins: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, chapterId, priceCoins }: UnlockRequest = await req.json();

    if (!userId || !chapterId || priceCoins === undefined || priceCoins < 0) {
      return new Response(
        JSON.stringify({ error: "Invalid unlock parameters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Call atomic stored procedure executing 70/30 split and immutable ledger deduction
    const { data, error } = await supabase.rpc("process_chapter_unlock_revenue", {
      p_user_id: userId,
      p_chapter_id: chapterId,
      p_amount_coins: priceCoins,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        chapterId,
        details: data,
        unlockedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
