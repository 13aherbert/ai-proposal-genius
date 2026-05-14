// Public, no-JWT edge function: generates a one-off executive summary from
// pasted context. Used by the public /tools/executive-summary-generator page.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_INPUT = 8000;
const VALID_TONES = ["formal", "confident", "concise"] as const;
type Tone = (typeof VALID_TONES)[number];

const TONE_GUIDANCE: Record<Tone, string> = {
  formal: "Use formal, federal-procurement language. Reference compliance, mission alignment, and risk mitigation.",
  confident: "Use confident, commercial enterprise language. Lead with business outcomes and competitive differentiation.",
  concise: "Use direct, technical language for IT and engineering buyers. Prioritise architecture, integration, and measurable performance.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { context?: unknown; tone?: unknown; targetWords?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const context = typeof body.context === "string" ? body.context.trim() : "";
  const tone: Tone = VALID_TONES.includes(body.tone as Tone) ? (body.tone as Tone) : "confident";
  const targetWords = Math.min(400, Math.max(150, Number(body.targetWords) || 250));

  if (context.length < 80) {
    return new Response(JSON.stringify({ error: "Context must be at least 80 characters." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (context.length > MAX_INPUT) {
    return new Response(JSON.stringify({ error: `Context must be under ${MAX_INPUT} characters.` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `You are an expert proposal writer crafting executive summaries for B2B and government RFP responses. ${TONE_GUIDANCE[tone]}

Structure the summary with this implicit flow (no headings, prose only):
1. Opening hook that demonstrates understanding of the client's situation.
2. Restate the problem or opportunity in the client's own terms.
3. Present the proposed solution and approach in plain language.
4. Provide proof — relevant outcomes, capabilities, or differentiators.
5. Close with a confident commitment to delivery.

Hard rules:
- Target ${targetWords} words (within ±15%).
- Synthesise ONLY from the provided context. Never invent companies, customers, dollar amounts, or statistics.
- No headings, no bullet lists, no markdown. Flowing prose only.
- Avoid filler words: "leverage", "synergize", "world-class", "best-of-breed", "cutting-edge", "robust solution".
- Refer to the offering as "we" / "our team". Refer to the buyer in the second person where natural.`;

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate an executive summary from the following context:\n\n${context}` },
        ],
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "AI is rate-limited. Try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const summary = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!summary) {
      return new Response(JSON.stringify({ error: "AI returned an empty response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Executive summary generation error:", err);
    return new Response(JSON.stringify({ error: "Internal error generating summary" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
