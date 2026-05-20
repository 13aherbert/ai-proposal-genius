// Public, no-JWT edge function: generates a structured proposal outline from
// pasted RFP text. Used by the public /tools/proposal-outline-generator page.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_INPUT = 12000;
const VALID_TYPES = ["federal", "sled", "commercial"] as const;
type ProposalType = (typeof VALID_TYPES)[number];

const TYPE_GUIDANCE: Record<ProposalType, string> = {
  federal:
    "Federal FAR-based response. Mirror Section L instructions in order. Common volumes: Technical, Management, Past Performance, Price. Use formal Federal proposal voice.",
  sled:
    "State/Local/Education solicitation. Mirror the order of the issuing agency's required response format. Allow procurement-specific sections (vendor questionnaire, references, MWBE).",
  commercial:
    "Commercial enterprise RFP. Lead with executive summary, solution overview and business outcomes. Pricing and contract terms typically last.",
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

  let body: { rfp?: unknown; proposalType?: unknown; pageLimit?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rfp = typeof body.rfp === "string" ? body.rfp.trim() : "";
  const proposalType: ProposalType = VALID_TYPES.includes(body.proposalType as ProposalType)
    ? (body.proposalType as ProposalType)
    : "federal";
  const pageLimit = Math.min(500, Math.max(5, Number(body.pageLimit) || 40));

  if (rfp.length < 200) {
    return new Response(JSON.stringify({ error: "RFP text must be at least 200 characters." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (rfp.length > MAX_INPUT) {
    return new Response(JSON.stringify({ error: `RFP text must be under ${MAX_INPUT} characters.` }), {
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

  const systemPrompt = `You are an expert proposal architect. Generate a structured proposal outline from RFP text.

Context type: ${TYPE_GUIDANCE[proposalType]}

Hard rules:
- Mirror the RFP's required response order whenever it is explicit (Section L, Submission Requirements, Response Format).
- Total page allocations across all sections must equal ${pageLimit}.
- Allocate more pages to sections with higher evaluation weight (Section M) when visible.
- Produce 5–12 top-level sections. Do not include front-matter (cover, ToC) in the count.
- For each section, list 2–4 short question prompts that the writer must answer in that section. Phrase them as questions ("How will you...?", "Demonstrate that...").
- Output ONLY valid JSON, no markdown fences, matching this shape:
{"sections":[{"number":"1","title":"...","pages":4,"questions":["...","..."]}]}`;

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a proposal outline from this RFP excerpt:\n\n${rfp}` },
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
    const raw = data?.choices?.[0]?.message?.content?.trim() || "";

    let parsed: { sections?: unknown } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Some models wrap JSON; try to extract between first { and last }
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { /* ignore */ }
      }
    }

    const sectionsIn = Array.isArray((parsed as { sections?: unknown })?.sections)
      ? ((parsed as { sections: unknown[] }).sections)
      : [];

    const sections = sectionsIn
      .map((s, i) => {
        const o = (s ?? {}) as Record<string, unknown>;
        const questionsRaw = Array.isArray(o.questions) ? o.questions : [];
        return {
          number: typeof o.number === "string" || typeof o.number === "number" ? String(o.number) : String(i + 1),
          title: typeof o.title === "string" ? o.title.slice(0, 200) : `Section ${i + 1}`,
          pages: Math.max(1, Math.min(pageLimit, Number(o.pages) || 1)),
          questions: questionsRaw
            .map((q) => (typeof q === "string" ? q.trim().slice(0, 300) : ""))
            .filter(Boolean)
            .slice(0, 6),
        };
      })
      .slice(0, 20);

    if (sections.length === 0) {
      return new Response(JSON.stringify({ error: "AI returned an empty outline. Try with more RFP text." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sections }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proposal outline generation error:", err);
    return new Response(JSON.stringify({ error: "Internal error generating outline" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
