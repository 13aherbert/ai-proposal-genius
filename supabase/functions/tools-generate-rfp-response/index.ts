// Public, no-JWT edge function: generates a short teaser RFP response from
// a single RFP question + basic company info. Powers /tools/ai-rfp-response-generator.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_Q = 2000;
const MAX_DESC = 600;
const MAX_DIFF = 400;
const MAX_NAME = 120;
const MAX_INDUSTRY = 60;
const TARGET_WORDS = 150;

function clip(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const question = clip(body.question, MAX_Q);
  const companyName = clip(body.companyName, MAX_NAME);
  const industry = clip(body.industry, MAX_INDUSTRY);
  const description = clip(body.description, MAX_DESC);
  const differentiator = clip(body.differentiator, MAX_DIFF);

  if (question.length < 20) {
    return new Response(JSON.stringify({ error: "RFP question must be at least 20 characters." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!companyName || !description) {
    return new Response(JSON.stringify({ error: "Company name and description are required." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `You are an expert proposal writer drafting a SHORT TEASER response to a single RFP question.

Rules:
- Target ${TARGET_WORDS} words (hard ceiling 165). End mid-thought is acceptable — this is a teaser.
- Open with the buyer's outcome, not "We are pleased to..."
- Reference the company's stated differentiator naturally; do not invent capabilities, customers, dollar amounts, certifications or past performance.
- Use confident professional prose. No headings, no bullets, no markdown.
- Avoid filler: "leverage", "synergize", "world-class", "best-of-breed", "cutting-edge", "robust solution".
- Refer to the offering as "we" / "our team". Address the buyer in the second person where natural.`;

  const userPrompt = `RFP question:
"""${question}"""

Company name: ${companyName}
Industry: ${industry || "Not specified"}
What we do: ${description}
Our key differentiator: ${differentiator || "Not specified"}

Draft a ~${TARGET_WORDS}-word teaser response.`;

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "AI is rate-limited. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const response = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!response) {
      return new Response(JSON.stringify({ error: "AI returned an empty response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim to ~TARGET_WORDS words for the teaser
    const words = response.split(/\s+/);
    const teaser = words.length > TARGET_WORDS + 15
      ? words.slice(0, TARGET_WORDS).join(" ") + "…"
      : response;

    return new Response(JSON.stringify({ response: teaser, wordCount: Math.min(words.length, TARGET_WORDS) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RFP response generation error:", err);
    return new Response(JSON.stringify({ error: "Internal error generating response" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
