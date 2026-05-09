import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe API key not configured");

    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      throw new Error("code is required");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user || !user.email) {
      throw new Error("Authentication failed");
    }

    // Reject existing paid users
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("plan_type, status, is_lifetime")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      existing &&
      (existing.is_lifetime ||
        (existing.status === "active" &&
          existing.plan_type &&
          !["starter", "trial"].includes(existing.plan_type)))
    ) {
      return new Response(
        JSON.stringify({ error: "Lifetime deal is for new accounts only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Re-validate the code server-side
    const { data: validation, error: vErr } = await supabase.rpc("validate_lifetime_code", {
      _code: code.trim(),
    });
    if (vErr) throw new Error("Code validation failed");
    if (!validation?.valid) {
      return new Response(
        JSON.stringify({ error: "Code is not redeemable", reason: validation?.reason }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get/create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = customers.data[0] ??
      await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });

    const origin = req.headers.get("origin") ?? "https://optirfp.ai";

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: user.id,
      mode: "payment",
      line_items: [{ price: validation.price_id, quantity: 1 }],
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}&lifetime=1`,
      cancel_url: `${origin}/lifetime?code=${encodeURIComponent(code)}`,
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          lifetime_code: code,
          lifetime_code_id: validation.code_id,
          plan_slug: validation.plan_slug,
        },
      },
      metadata: {
        user_id: user.id,
        lifetime_code: code,
        lifetime_code_id: validation.code_id,
        plan_slug: validation.plan_slug,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-lifetime-checkout error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
