import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, analysis } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw new Error('Failed to fetch project details');

    // Fetch knowledge base entries
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*');

    if (knowledgeError) throw new Error('Failed to fetch knowledge base entries');

    // Construct the prompt with project information and format instructions
    const prompt = `Act as an expert proposal writer.

The company ${project.business_name || '[Business Name Not Specified]'} is submitting a proposal to ${project.client_name || '[Client Name Not Specified]'} to a solicitation titled ${project.title}.

The solicitation includes a Statement of Work (SOW) that describes the work to be performed. The SOW and the proposal instructions are the Request for Proposal.
Review the attached Request for Proposal's SOW and the instructions and create a detailed outline for the proposal. Ensure the outline covers all the items specified in the instructions. Be sure to follow the proposal instructions exactly. For the individual section headings, use the same words used in the proposal instructions.

Format your response as a structured outline using markdown, following this format:
# Section 1: [Main Section Title]
## 1.1 [Subsection Title]
- Key point or requirement
- Supporting details
  - Additional detail or specification

## 1.2 [Subsection Title]
- Key requirements
  - Specific details

# Section 2: [Main Section Title]
[Continue with the same structure]

Here is the RFP analysis to help you understand the requirements:
${analysis}

Here are relevant knowledge base entries that might be helpful:
${knowledgeEntries.map(entry => `
Category: ${entry.category}
Title: ${entry.title}
Content: ${entry.content || 'No content provided'}
---`).join('\n')}`;

    // Call Anthropic's API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const outline = data.content[0].text;

    return new Response(
      JSON.stringify({ outline }),
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