import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";

const enc = new TextEncoder();

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function unsubscribe(
  email: string,
  source: string,
  ip: string | null,
  userAgent: string | null,
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const lower = email.toLowerCase();
  const { error } = await supabase
    .from("email_unsubscribes")
    .upsert(
      {
        email: lower,
        source,
        ip,
        user_agent: userAgent,
        unsubscribed_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const SECRET = Deno.env.get("UNSUBSCRIBE_SECRET");
  if (!SECRET) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent");

    let email = "";
    let token = "";
    let oneClick = false;

    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        email = String(body.email || url.searchParams.get("email") || "");
        token = String(body.token || url.searchParams.get("token") || "");
      } else {
        const form = await req.formData().catch(() => null);
        email = String(form?.get("email") || url.searchParams.get("email") || "");
        token = String(form?.get("token") || url.searchParams.get("token") || "");
      }
      // RFC 8058 List-Unsubscribe-Post one-click
      oneClick = url.searchParams.get("List-Unsubscribe") === "One-Click" ||
        (req.headers.get("content-type") || "").includes("application/x-www-form-urlencoded");
    } else {
      // GET: verify token only (preview); page UI handles confirmation
      email = url.searchParams.get("email") || "";
      token = url.searchParams.get("token") || "";
    }

    if (!email || !token) {
      return new Response(JSON.stringify({ ok: false, error: "Missing email or token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = await hmacHex(SECRET, email.toLowerCase());
    if (!timingSafeEqual(expected, token)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      await unsubscribe(email, oneClick ? "one-click" : "page", ip, userAgent);
    }

    return new Response(
      JSON.stringify({ ok: true, email: email.toLowerCase(), unsubscribed: req.method === "POST" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("email-unsubscribe error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
