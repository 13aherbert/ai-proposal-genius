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

  // Filter out entries without content and format them for the AI
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

  // Group entries by category for better context organization
  const entriesByCategory = entries.reduce((acc: any, entry: any) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});

  // Format the context with clear category separation
  return Object.entries(entriesByCategory)
    .map(([category, categoryEntries]: [string, any[]]) => {
      const entriesText = categoryEntries
        .map((entry: any) => `${entry.title}:\n${entry.content}`)
        .join('\n\n');
      return `Category: ${category}\n${entriesText}`;
    })
    .join('\n\n==========\n\n');
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
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project and knowledge base context
    const [project, knowledgeEntries] = await Promise.all([
      getProjectContext(supabase, projectId),
      getKnowledgeBaseEntries(supabase, userId)
    ]);

    // Format knowledge base entries with better structure
    const knowledgeBaseContext = formatKnowledgeBaseContext(knowledgeEntries);

    // Construct the prompt with improved context integration
    const prompt = `\n\nHuman: You are writing the "${sectionTitle}" section for a business proposal. Here is the relevant context:

Project Information:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}
- RFP Analysis: ${project.analysis || 'No analysis available'}
- Proposal Outline: ${project.proposal_outline || 'No outline available'}

Knowledge Base Information:
${knowledgeBaseContext}

Instructions for using the Knowledge Base:
1. Review ALL knowledge base entries carefully
2. Incorporate relevant information from EACH category that applies to this section
3. Use specific examples and data points from the knowledge base
4. Maintain consistency with company standards found in boilerplates
5. Reference any relevant legal disclaimers or compliance requirements
6. Include industry benchmarks or competitive insights where applicable
7. Apply pricing templates or estimation tools if relevant to this section

Using the above context, write a detailed and professional "${sectionTitle}" section for the proposal. Focus on:
1. Addressing specific client needs mentioned in the RFP analysis
2. Incorporating relevant company information from the knowledge base
3. Maintaining a formal, business-appropriate tone
4. Being detailed and thorough while staying relevant to the section topic
5. Using active voice and clear language
6. Supporting all claims with specific examples from the knowledge base
7. Ensuring all information aligns with both the RFP requirements and company capabilities

Write the section now:\n\nAssistant:`;

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