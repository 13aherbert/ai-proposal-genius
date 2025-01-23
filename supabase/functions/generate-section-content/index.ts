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

  let formattedContext = "=== KNOWLEDGE BASE CONTENT (YOU MUST USE THIS INFORMATION AND NOTHING ELSE) ===\n\n";
  
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

    const prompt = `\n\nHuman: You are writing the "${sectionTitle}" section for a business proposal. You MUST ONLY use the knowledge base information provided below to create this section. DO NOT make up or infer any information that is not explicitly stated in the knowledge base.

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- RFP Analysis: ${project.analysis || 'No analysis available'}

${knowledgeBaseContext}

STRICT INSTRUCTIONS:
1. You MUST ONLY use information that is explicitly stated in the knowledge base above. DO NOT make up or infer any information.
2. If you cannot find specific information in the knowledge base for a point you want to make, DO NOT include that point.
3. For every statement you make, you must be able to point to the exact source in the knowledge base.
4. Use the exact terminology and phrasing from the knowledge base to maintain accuracy.
5. If relevant boilerplate text exists in the knowledge base, use it verbatim.
6. If relevant pricing information exists in the knowledge base, use it exactly as stated.
7. If relevant legal disclaimers exist in the knowledge base, include them without modification.
8. Write in active voice and maintain a formal, professional tone.

Write the section now, using ONLY the information provided above:\n\nAssistant:`;

    console.log('Sending prompt to Claude with knowledge base entries:', knowledgeEntries.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
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
      const errorData = await response.text();
      console.error('Claude API error response:', errorData);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Failed to generate content with Claude: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Claude API response received');

    if (!data.content) {
      console.error('Unexpected response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from Claude API');
    }

    return new Response(JSON.stringify({ content: data.content[0].text }), {
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