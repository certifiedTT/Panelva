// Supabase Edge Function: process-subscription
// Purpose: Premium reader billing & membership subscription
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionRequest {
  userId: string;
  tier: "PLUS" | "PREMIUM";
  paymentToken?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, tier }: SubscriptionRequest = await req.json();

    if (!userId || !tier) {
      return new Response(
        JSON.stringify({ error: "Missing required subscription parameters (userId, tier)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bonusCredits = tier === "PREMIUM" ? 500 : 250;
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId,
        userId,
        tier,
        status: "ACTIVE",
        bonusCreditsGranted: bonusCredits,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
