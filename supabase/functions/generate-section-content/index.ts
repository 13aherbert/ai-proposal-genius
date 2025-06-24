
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GenerateContentRequest, Project, KnowledgeEntry } from "./types.ts";
import { generatePrompt } from "./prompt.ts";
import { formatKnowledgeBaseContext } from "./knowledge-base.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

// Enhanced function to remove headers and meta-commentary from generated content
function cleanGeneratedContent(content: string, sectionTitle: string): string {
  let cleanedContent = content.trim();
  
  // Remove various header formats that might include the section title
  const headerPatterns = [
    new RegExp(`^#\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^##\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^###\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^\\*\\*${sectionTitle}\\*\\*\\s*\n?`, 'i'),
    new RegExp(`^\\*${sectionTitle}\\*\\s*\n?`, 'i'),
    new RegExp(`^${sectionTitle}\\s*[:|-]\\s*\n?`, 'i'),
  ];

  // Remove meta-commentary patterns
  const metaCommentaryPatterns = [
    /^Here is the .+ section.*/i,
    /^Below is the .+ section.*/i,
    /^The following .+ section.*/i,
    /^This section .+/i,
    /^Based on the (knowledge base|provided information).*/i,
    /^Using the (knowledge base|provided information).*/i,
    /^According to the (knowledge base|provided information).*/i,
    /^From the (knowledge base|provided information).*/i,
    /^Drawing from the knowledge base.*/i,
    /^The knowledge base (contains|provides|shows).*/i,
    /^I have (created|written|generated).*/i,
    /^I will (create|write|generate).*/i,
    /^Let me (create|write|generate).*/i,
    /^.*using only information from the.*knowledge base.*/i,
    /^.*leveraging the knowledge base.*/i,
    /^.*information available in the knowledge base.*/i,
    /^Note:.*/i,
    /^Please note:.*/i,
    /^\*Note:.*/i,
    /^Important:.*/i,
  ];

  // Apply header pattern removal
  for (const pattern of headerPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // Apply meta-commentary pattern removal
  for (const pattern of metaCommentaryPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // Remove any lines that start with common meta-commentary phrases
  const lines = cleanedContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim().toLowerCase();
    return !(
      trimmedLine.startsWith('here is') ||
      trimmedLine.startsWith('below is') ||
      trimmedLine.startsWith('this section') ||
      trimmedLine.startsWith('based on') ||
      trimmedLine.startsWith('using the') ||
      trimmedLine.startsWith('according to') ||
      trimmedLine.startsWith('from the') ||
      trimmedLine.startsWith('drawing from') ||
      trimmedLine.startsWith('the knowledge base') ||
      trimmedLine.startsWith('i have') ||
      trimmedLine.startsWith('i will') ||
      trimmedLine.startsWith('let me')
    );
  });

  cleanedContent = filteredLines.join('\n');

  // Remove any leading/trailing whitespace and multiple consecutive newlines
  cleanedContent = cleanedContent.trim().replace(/\n{3,}/g, '\n\n');
  
  return cleanedContent;
}

// Validate content for any remaining meta-commentary
function validateContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowerContent = content.toLowerCase();
  
  const problematicPhrases = [
    'here is the',
    'below is the',
    'this section',
    'based on the knowledge base',
    'using the knowledge base',
    'according to the knowledge base',
    'from the knowledge base',
    'knowledge base contains',
    'i have created',
    'i will create',
    'let me create'
  ];

  for (const phrase of problematicPhrases) {
    if (lowerContent.includes(phrase)) {
      issues.push(`Contains meta-commentary: "${phrase}"`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
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
    console.log('Prompt generated, calling Claude API with enhanced model');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Upgraded to newer model
        max_tokens: 4000,
        temperature: 0.3, // Lower temperature for more precise instruction following
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

    // Get the generated content and clean it thoroughly
    let generatedContent = result.content[0].text;
    const cleanedContent = cleanGeneratedContent(generatedContent, sectionTitle);
    
    // Validate the cleaned content
    const validation = validateContent(cleanedContent);
    
    if (!validation.isValid) {
      console.warn('Content validation issues detected:', validation.issues);
      // Log the issues but don't fail - the cleaning should have handled most cases
    }
    
    console.log('Content processed, cleaned, and validated');

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
    console.error('Error in generate-section-content:', error);
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
