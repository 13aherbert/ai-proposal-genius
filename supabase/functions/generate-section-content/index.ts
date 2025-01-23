import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';
import { formatKnowledgeBaseContext } from './knowledge-base.ts';
import { generatePrompt } from './prompt.ts';
import { generateWithClaude } from './claude-client.ts';
import type { GenerateContentRequest, Project, KnowledgeEntry } from './types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, sectionTitle, userId } = await req.json() as GenerateContentRequest;

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      throw new Error('Project not found or access denied');
    }

    // Fetch knowledge base entries
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('user_id', userId);

    if (knowledgeError) {
      console.error('Error fetching knowledge entries:', knowledgeError);
      throw new Error('Failed to fetch knowledge base entries');
    }

    console.log('Fetched knowledge base entries:', knowledgeEntries.length);

    // Generate content
    const knowledgeBaseContext = formatKnowledgeBaseContext(knowledgeEntries as KnowledgeEntry[]);
    const prompt = generatePrompt(sectionTitle, project as Project, knowledgeBaseContext);
    const content = await generateWithClaude(prompt, anthropicApiKey);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});