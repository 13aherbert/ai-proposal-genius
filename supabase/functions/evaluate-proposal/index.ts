import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { sections, analysis } = await req.json();

    // Format the sections content
    const proposalContent = sections
      .map(section => `${section.section_title}:\n${section.content || 'No content'}`)
      .join('\n\n');

    // Extract evaluation criteria from analysis
    const evaluationCriteria = analysis?.match(/Evaluation Criteria:([\s\S]*?)(?=\n#|\n$)/)?.[1] || '';

    const systemPrompt = `You are an expert proposal evaluator for government and enterprise RFPs. Your role is to provide specific, actionable feedback that helps improve proposal win rates.

IMPORTANT INSTRUCTIONS:
- You MUST complete ALL sections of the evaluation - do not truncate or cut off
- Be specific with examples from the actual proposal content
- Prioritize actionable feedback over general observations
- Score each criterion clearly (Strong/Medium/Weak)`;

    const userPrompt = `Review this proposal content against the RFP's evaluation criteria and provide comprehensive feedback.

RFP EVALUATION CRITERIA:
${evaluationCriteria || 'No specific criteria provided - evaluate based on general proposal best practices'}

PROPOSAL CONTENT:
${proposalContent}

Provide a COMPLETE evaluation with these sections (allocate words as shown):

## 1. ALIGNMENT WITH EVALUATION CRITERIA (~400 words)
For each criterion identified in the RFP:
- How well the proposal addresses it (with specific quotes/examples)
- Score: Strong / Medium / Weak
- What's missing or could be stronger

## 2. CONTENT QUALITY ANALYSIS (~300 words)
- Clarity and organization assessment
- Use of evidence and concrete examples
- Professional tone and language
- Technical accuracy

## 3. SECTION-BY-SECTION FEEDBACK (~400 words)
For each major section, provide:
- What works well
- What needs improvement
- Specific revision suggestions

## 4. PRIORITY IMPROVEMENT RECOMMENDATIONS (~400 words)
Numbered list of the TOP 10 most impactful improvements:
1. [Highest priority] - Specific action with example
2. [Second priority] - Specific action with example
...and so on

## 5. COMPETITIVE POSITIONING (~200 words)
- How this proposal would likely rank against competitors
- Key differentiators that should be emphasized more
- Vulnerabilities that could be exploited by competitors

## 6. OVERALL ASSESSMENT (~100 words)
- Summary score (1-10)
- Win probability estimate (Low/Medium/High)
- One-sentence summary of the most critical improvement needed

YOU MUST COMPLETE ALL 6 SECTIONS. Do not stop early.`;

    console.log('Calling Lovable AI Gateway for proposal evaluation');
    
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        max_tokens: 8000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      if (response.status === 402) {
        console.error('Credits exhausted');
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue using evaluations.' }),
          { 
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error details:', errorText);
      throw new Error(`AI Gateway error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const evaluation = result.choices?.[0]?.message?.content;
    
    if (!evaluation) {
      throw new Error('No evaluation content received from AI');
    }
    
    console.log('Evaluation completed successfully');

    return new Response(
      JSON.stringify({ evaluation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
