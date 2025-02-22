
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GenerateContentRequest, Project, KnowledgeEntry } from "./types.ts";
import { generatePrompt } from "./prompt.ts";
import { formatKnowledgeBaseContext } from "./knowledge-base.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { projectId, sectionTitle, userId } = await req.json() as GenerateContentRequest;

    console.log('Fetching project details for:', projectId);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (projectError) throw projectError;

    console.log('Fetching knowledge base entries');
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('user_id', userId);

    if (knowledgeError) throw knowledgeError;
    
    console.log(`Found ${knowledgeEntries?.length || 0} knowledge base entries`);
    
    // Format knowledge base context
    const knowledgeBaseContext = formatKnowledgeBaseContext(knowledgeEntries as KnowledgeEntry[]);
    console.log('Knowledge base context formatted');

    // Generate the prompt with project and knowledge base context
    const prompt = generatePrompt(sectionTitle, project as Project, knowledgeBaseContext);
    console.log('Prompt generated, calling OpenAI API');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a professional proposal writer that creates high-quality proposal content based on the provided context and requirements.'
        }, {
          role: 'user',
          content: prompt
        }],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to generate content');
    }

    const result = await response.json();
    console.log('OpenAI API response received');

    return new Response(
      JSON.stringify({
        content: result.choices[0].message.content
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
