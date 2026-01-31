import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sections, analysis } = await req.json();

    // Format the sections content
    const proposalContent = sections
      .map(section => `${section.section_title}:\n${section.content || 'No content'}`)
      .join('\n\n');

    // Extract evaluation criteria from analysis
    const evaluationCriteria = analysis?.match(/Evaluation Criteria:([\s\S]*?)(?=\n#|\n$)/)?.[1] || '';

    const prompt = `You are an expert proposal evaluator. Review this proposal content against the RFP's evaluation criteria and provide specific, actionable feedback for improvement.

RFP Evaluation Criteria:
${evaluationCriteria}

Proposal Content:
${proposalContent}

Provide a detailed evaluation that includes:
1. Alignment with Evaluation Criteria
- For each criterion, assess how well the proposal addresses it
- Identify any gaps or missing elements
- Score each criterion (Strong/Medium/Weak)

2. Content Quality Analysis
- Clarity and organization
- Use of evidence and examples
- Professional tone and language

3. Specific Improvement Recommendations
- Prioritized list of actionable improvements
- Examples of how to strengthen weak areas
- Additional content suggestions

Format your response in clear sections with markdown headings and bullet points.`;

    console.log('Calling Claude API for proposal evaluation');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error details:', errorText);
      throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Evaluation completed successfully');

    return new Response(
      JSON.stringify({ evaluation: result.content[0].text }),
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