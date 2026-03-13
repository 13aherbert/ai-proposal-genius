import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SAVINGS: Record<string, number> = {
  growth: 240,
  business: 600,
};

const TIER_NAMES: Record<string, string> = {
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

async function getUserEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function sendReminderEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ to: [to], subject, html }),
    });
    if (!res.ok) console.error("send-email failed:", await res.text());
  } catch (e) {
    console.error("send-email error:", e);
  }
}

serve(async () => {
  try {
    const now = new Date();

    // Check 30-day and 7-day windows
    const windows = [
      { days: 30, label: "30 days" },
      { days: 7, label: "7 days" },
    ];

    for (const window of windows) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + window.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Find annual subscriptions renewing on this date
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("user_id, plan_type, current_period_end")
        .eq("billing_interval", "annual")
        .eq("status", "active")
        .gte("current_period_end", `${dateStr}T00:00:00Z`)
        .lt("current_period_end", `${dateStr}T23:59:59Z`);

      if (error) {
        console.error("Query error:", error);
        continue;
      }

      console.log(`Found ${subs?.length ?? 0} annual renewals in ${window.label}`);

      for (const sub of subs ?? []) {
        const email = await getUserEmail(sub.user_id);
        if (!email) continue;

        const tierName = TIER_NAMES[sub.plan_type] ?? sub.plan_type;
        const savings = SAVINGS[sub.plan_type] ?? 0;
        const savingsLine = savings > 0
          ? `<p>You're saving <strong>$${savings}/year</strong> with annual billing on ${tierName}.</p>`
          : "";

        await sendReminderEmail(
          email,
          `🔔 Your OptiRFP ${tierName} plan renews in ${window.label}`,
          `<div style="font-family:sans-serif;max-width:560px;margin:auto">
            <h2>Annual renewal reminder</h2>
            <p>Your <strong>${tierName}</strong> plan will renew on
            <strong>${new Date(sub.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>.</p>
            ${savingsLine}
            <p>No action needed — your subscription will renew automatically.</p>
            <p><a href="https://ai-proposal-genius.lovable.app/subscription" style="display:inline-block;padding:10px 24px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">Manage subscription →</a></p>
          </div>`,
        );

        console.log(`Sent ${window.label} renewal reminder to ${email}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Renewal reminder error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
