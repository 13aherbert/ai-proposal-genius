// Public contact form submission endpoint.
// - No auth required (public form).
// - Inserts into user_feedback_submissions via service role.
// - Sends a notification email to the support inbox.
// - Basic rate limiting + honeypot to deter spam.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(150).optional().nullable(),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(10).max(5000),
  // honeypot - real users leave this blank
  hp: z.string().optional().nullable(),
});

// Simple in-memory rate limit (per isolate). Best-effort.
const recent = new Map<string, number[]>();
function rateLimited(ip: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const arr = (recent.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > limit;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Honeypot tripped - silently succeed
    if (parsed.data.hp) {
      return new Response(JSON.stringify({ success: true, ticketId: "ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, email, company, subject, message } = parsed.data;
    const ticketId = `CT-${Date.now()}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: insertError } = await supabase.from("user_feedback_submissions").insert({
      ticket_id: ticketId,
      type: "contact",
      severity: "medium",
      status: "open",
      name,
      email,
      company,
      subject,
      message,
      allow_contact: true,
      metadata: { ip, user_agent: req.headers.get("user-agent") },
    });
    if (insertError) {
      console.error("Insert failed:", insertError);
      return new Response(JSON.stringify({ error: "Could not save your message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort email notification to support
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          from: "OptiRFP Support <support@updates.optirfp.ai>",
          to: ["support@optirfp.ai"],
          subject: `Contact form: ${subject || `Message from ${name}`} [${ticketId}]`,
          templateType: "support",
          templateData: {
            name,
            ticketId,
            message: `From: ${name} <${email}>${company ? `\nCompany: ${company}` : ""}\n\n${message}`,
          },
          replyTo: email,
        },
      });
    } catch (err) {
      console.error("Email notification failed (non-fatal):", err);
    }

    return new Response(JSON.stringify({ success: true, ticketId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-contact-message error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
