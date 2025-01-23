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

async function getProjectContext(supabase: ReturnType<typeof createClient>, projectId: string) {
  console.log('Fetching project context for:', projectId);
  
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    throw projectError;
  }

  return project;
}

async function getKnowledgeBaseEntries(supabase: ReturnType<typeof createClient>, userId: string) {
  console.log('Fetching knowledge base entries');
  
  const { data: entries, error: entriesError } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('user_id', userId);

  if (entriesError) {
    console.error('Error fetching knowledge entries:', entriesError);
    throw entriesError;
  }

  return entries
    .filter(entry => entry.content || entry.parsed_content)
    .map(entry => ({
      title: entry.title,
      category: entry.category,
      content: entry.parsed_content || entry.content
    }));
}

function formatKnowledgeBaseContext(entries: any[]) {
  if (!entries || entries.length === 0) {
    return "No knowledge base entries available.";
  }

  const entriesByCategory = entries.reduce((acc: any, entry: any) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  let formattedContext = "=== KNOWLEDGE BASE CONTENT (YOU MUST USE THIS INFORMATION) ===\n\n";
  
  Object.entries(entriesByCategory).forEach(([category, categoryEntries]: [string, any[]]) => {
    formattedContext += `### ${category.toUpperCase()} ###\n\n`;
    categoryEntries.forEach((entry: any) => {
      formattedContext += `${entry.title}:\n${entry.content}\n---\n\n`;
    });
  });

  return formattedContext;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sectionTitle, projectId, userId } = await req.json();
    
    if (!anthropicApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables');
      throw new Error('API key or Supabase configuration is missing');
    }

    console.log(`Generating content for section: ${sectionTitle} in project: ${projectId}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const [project, knowledgeEntries] = await Promise.all([
      getProjectContext(supabase, projectId),
      getKnowledgeBaseEntries(supabase, userId)
    ]);

    const knowledgeBaseContext = formatKnowledgeBaseContext(knowledgeEntries);

    const prompt = `\n\nHuman: You are writing the "${sectionTitle}" section for a business proposal. You MUST use the knowledge base information provided below to create this section.

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- RFP Analysis: ${project.analysis || 'No analysis available'}
- Proposal Outline: ${project.proposal_outline || 'No outline available'}

${knowledgeBaseContext}

IMPORTANT INSTRUCTIONS:
1. You MUST use the knowledge base information provided above. Do not say you don't have access to information - it's all provided above.
2. For each point you make, reference specific information from the knowledge base.
3. If you find relevant boilerplate text in the knowledge base, incorporate it.
4. If you find relevant pricing or estimation information, include it.
5. If you find relevant legal disclaimers, include them.
6. Maintain consistency with any company standards found in the knowledge base.
7. Use specific examples and data points from the knowledge base.

Write a detailed and professional "${sectionTitle}" section that:
1. Addresses the client's specific needs from the RFP analysis
2. Uses concrete information from the knowledge base
3. Maintains a formal, business-appropriate tone
4. Is detailed and thorough
5. Uses active voice
6. Supports all claims with specific examples from the knowledge base

Write the section now:\n\nAssistant:`;

    console.log('Sending prompt to Claude with knowledge base entries:', knowledgeEntries.length);

    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-2',
        prompt,
        max_tokens_to_sample: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Claude API error response:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Failed to generate content with Claude: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Claude API response received');

    if (!data.completion) {
      console.error('Unexpected response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from Claude API');
    }

    return new Response(JSON.stringify({ content: data.completion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-section-content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});