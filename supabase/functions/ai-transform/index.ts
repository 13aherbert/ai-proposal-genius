import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  rewrite:
    "You are a professional proposal writer. Rewrite the selected text to improve clarity, flow, and impact while preserving the original meaning and all formatting (bold, italic, links, lists, etc.). Return only the rewritten text with HTML formatting preserved.",
  expand:
    "You are a professional proposal writer. Expand the selected text with more detail, examples, and supporting information. Keep the same tone and style. Return the expanded text with HTML formatting.",
  summarize:
    "You are a professional proposal writer. Summarize the selected text to be more concise while keeping the key points. Return only the summarized text with HTML formatting.",
  formal:
    "You are a professional proposal writer. Rewrite the selected text in a more formal, professional tone suitable for government/enterprise proposals. Return only the rewritten text with HTML formatting.",
  concise:
    "You are a professional proposal writer. Make the selected text more concise by removing redundancy and tightening the language. Preserve key information. Return only the rewritten text with HTML formatting.",
  fix_grammar:
    "You are a professional editor. Fix any grammar, spelling, punctuation, or syntax errors in the selected text. Do not change the meaning or style. Return only the corrected text with HTML formatting.",
  custom:
    "You are a helpful AI assistant for proposal writing. Follow the user's instructions to transform the selected text. Return only the transformed text with HTML formatting.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: "Use a professional, business-appropriate tone.",
  persuasive: "Use a persuasive, compelling tone that emphasizes value and benefits.",
  technical: "Use a precise, technical tone with appropriate terminology.",
  executive: "Use a concise, executive-level tone focused on strategic impact.",
  conversational: "Use a warm, conversational but still professional tone.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require an authenticated user — protects against AI credit abuse
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, selectedText, context, sectionTitle, tone, customPrompt } =
      await req.json();

    if (!action || !selectedText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, selectedText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemBase = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.custom;
    const toneInstruction = tone && TONE_INSTRUCTIONS[tone] ? ` ${TONE_INSTRUCTIONS[tone]}` : "";

    const systemPrompt = `${systemBase}${toneInstruction}

IMPORTANT RULES:
- Return ONLY the transformed text, no explanations or preamble.
- Preserve HTML formatting tags (bold, italic, links, lists, tables).
- If the text contains HTML, keep the HTML structure intact.
- Do not wrap your response in code blocks or quotes.`;

    let userPrompt = `Section: "${sectionTitle || "Untitled"}"

Selected text to transform:
${selectedText}`;

    if (context) {
      userPrompt += `\n\nFull section context (for reference only, do not include in output):
${context.substring(0, 2000)}`;
    }

    if (action === "custom" && customPrompt) {
      userPrompt += `\n\nUser instruction: ${customPrompt}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const transformedText = data.choices?.[0]?.message?.content?.trim();

    if (!transformedText) {
      return new Response(
        JSON.stringify({ error: "AI couldn't transform this text. Try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ transformedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timed out. Please try again." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("ai-transform error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
