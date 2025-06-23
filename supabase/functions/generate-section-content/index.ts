
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GenerateContentRequest, Project, KnowledgeEntry } from "./types.ts";
import { generatePrompt } from "./prompt.ts";
import { formatKnowledgeBaseContext } from "./knowledge-base.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

// Function to remove section headers from generated content
function removeHeaderFromContent(content: string, sectionTitle: string): string {
  // Remove various header formats that might include the section title
  const headerPatterns = [
    new RegExp(`^#\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^##\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^###\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^\\*\\*${sectionTitle}\\*\\*\\s*\n?`, 'i'),
    new RegExp(`^\\*${sectionTitle}\\*\\s*\n?`, 'i'),
    // Remove any line that starts with the section title followed by common separators
    new RegExp(`^${sectionTitle}\\s*[:|-]\\s*\n?`, 'i'),
  ];

  let cleanedContent = content.trim();
  
  // Apply each pattern to remove headers
  for (const pattern of headerPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // Remove any leading newlines or whitespace after header removal
  cleanedContent = cleanedContent.trim();
  
  return cleanedContent;
}

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
    console.log('Prompt generated, calling Claude API');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const result = await response.json();
    console.log('Claude API response received');

    if (!response.ok) {
      console.error('Claude API error:', result);
      throw new Error(`Claude API error: ${result.error?.message || 'Unknown error'}`);
    }

    // Get the generated content and remove any headers
    let generatedContent = result.content[0].text;
    const cleanedContent = removeHeaderFromContent(generatedContent, sectionTitle);
    
    console.log('Content processed and headers removed');

    return new Response(
      JSON.stringify({
        content: cleanedContent
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
