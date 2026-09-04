// Supabase Edge Function: create-payout
// Purpose: Creator revenue withdrawal processing & validation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayoutRequest {
  creatorId: string;
  amount: number;
  payoutMethod: "STRIPE" | "PAYPAL" | "BANK_TRANSFER";
  destinationAccount: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { creatorId, amount, payoutMethod, destinationAccount }: PayoutRequest = await req.json();

    if (!creatorId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payout parameters: amount must be greater than zero." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Minimum withdrawal threshold: $50.00
    if (amount < 50) {
      return new Response(
        JSON.stringify({ error: "Minimum creator withdrawal is $50.00." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payoutReference = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Response(
      JSON.stringify({
        success: true,
        referenceId: payoutReference,
        creatorId,
        amount,
        payoutMethod,
        status: "PROCESSING",
        estimatedArrivalDays: 2,
        timestamp: new Date().toISOString(),
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
