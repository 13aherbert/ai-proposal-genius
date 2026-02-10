import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function extractSection(analysis: string, patterns: string[]): string {
  for (const pattern of patterns) {
    const regex = new RegExp(`(?:#{1,3}\\s*)?(?:\\*\\*)?${pattern}(?:\\*\\*)?[:\\s]*([\\s\\S]*?)(?=\\n#{1,3}\\s|\\n\\*\\*\\d+|$)`, 'i');
    const match = analysis.match(regex);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return '';
}

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

    // Extract evaluation criteria with corrected regex patterns
    const evaluationCriteria = extractSection(analysis || '', [
      'EVALUATION CRITERIA & SCORING',
      'EVALUATION CRITERIA',
      'Evaluation Criteria & Scoring',
      'Evaluation Criteria',
      'SCORING CRITERIA',
      'Scoring Criteria',
    ]);

    // Extract key requirements
    const keyRequirements = extractSection(analysis || '', [
      'KEY REQUIREMENTS ANALYSIS',
      'KEY REQUIREMENTS',
      'Key Requirements Analysis',
      'Key Requirements',
      'REQUIREMENTS ANALYSIS',
    ]);

    // Extract win probability / competitive positioning context
    const winAssessment = extractSection(analysis || '', [
      'WIN PROBABILITY ASSESSMENT',
      'WIN PROBABILITY',
      'Win Probability Assessment',
      'COMPETITIVE ASSESSMENT',
    ]);

    const hasRfpCriteria = evaluationCriteria.length > 50;

    console.log('Extracted evaluation criteria length:', evaluationCriteria.length);
    console.log('Has RFP-specific criteria:', hasRfpCriteria);
    console.log('Key requirements length:', keyRequirements.length);

    const criteriaInstruction = hasRfpCriteria
      ? `CRITICAL: The following evaluation criteria were extracted directly from the uploaded RFP. You MUST evaluate against every criterion listed below. Score each one individually. Do NOT substitute generic criteria.\n\nRFP EVALUATION CRITERIA (from uploaded RFP):\n${evaluationCriteria}`
      : `No specific evaluation criteria were found in the RFP analysis. Evaluate against standard government/enterprise proposal best practices including: Technical Approach, Management Approach, Past Performance, Staffing/Key Personnel, Cost/Price, and Compliance.`;

    const requirementsContext = keyRequirements
      ? `\n\nRFP REQUIREMENTS & EXPECTATIONS:\n${keyRequirements}`
      : '';

    const competitiveContext = winAssessment
      ? `\n\nRFP WIN FACTORS:\n${winAssessment}`
      : '';

    const systemPrompt = `You are an expert proposal evaluator for government and enterprise RFPs. Your role is to provide specific, actionable feedback that helps improve proposal win rates.

IMPORTANT INSTRUCTIONS:
- You MUST complete ALL sections of the evaluation - do not truncate or cut off
- Be specific with examples from the actual proposal content
- Prioritize actionable feedback over general observations
- Score each criterion clearly (Strong/Medium/Weak)
- ${hasRfpCriteria ? 'You MUST evaluate against the specific RFP criteria provided. Do NOT use generic criteria as substitutes.' : 'Since no RFP-specific criteria were found, evaluate against standard proposal best practices.'}`;

    const userPrompt = `Review this proposal content against the RFP's evaluation criteria and provide comprehensive feedback.

${criteriaInstruction}
${requirementsContext}
${competitiveContext}

PROPOSAL CONTENT:
${proposalContent}

Provide a COMPLETE evaluation with these sections (allocate words as shown):

## 1. ALIGNMENT WITH EVALUATION CRITERIA (~400 words)
${hasRfpCriteria ? 'For EACH criterion from the RFP listed above:' : 'For each standard evaluation criterion:'}
- How well the proposal addresses it (with specific quotes/examples)
- Score: Strong / Medium / Weak
- What's missing or could be stronger
${hasRfpCriteria ? '- Reference the specific scoring weights/points if provided in the criteria' : ''}

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
