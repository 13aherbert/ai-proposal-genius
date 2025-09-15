import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Function starting up...");

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

console.log("Environment variables loaded:", {
  supabaseUrl: supabaseUrl ? "✓" : "✗",
  supabaseServiceKey: supabaseServiceKey ? "✓" : "✗", 
  anthropicApiKey: anthropicApiKey ? "✓" : "✗"
});

if (!supabaseUrl || !supabaseServiceKey || !anthropicApiKey) {
  console.error("Missing required environment variables");
  throw new Error("Missing required environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log("Supabase client created successfully");

interface GenerateContentRequest {
  projectId: string;
  sectionTitle: string;
  userId: string;
  strictMode?: boolean;
}

interface Project {
  project_id: string;
  title: string;
  client_name?: string;
  business_name?: string;
  analysis?: any;
  proposal_outline?: any;
}

interface KnowledgeEntry {
  entry_id: string;
  title: string; 
  content: string;
  category: string;
  tags?: string[];
}

// Simplified content cleaning function
function cleanGeneratedContent(content: string, sectionTitle: string): string {
  let cleanedContent = content.trim();
  
  // Remove section headers
  const headerPatterns = [
    new RegExp(`^#\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^##\\s*${sectionTitle}\\s*\n?`, 'i'),
    new RegExp(`^###\\s*${sectionTitle}\\s*\n?`, 'i'),
  ];

  headerPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });

  return cleanedContent.trim();
}

// Basic validation function
function validateContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (content.length < 50) {
    issues.push("Content too short");
  }
  
  if (content.includes("[PLACEHOLDER]") || content.includes("TODO")) {
    issues.push("Contains placeholder text");
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

serve(async (req) => {
  console.log("Request received:", req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing request body...");
    const { projectId, sectionTitle, userId, strictMode = false }: GenerateContentRequest = await req.json();
    
    console.log("Request parameters:", { projectId, sectionTitle, userId, strictMode });

    // Fetch project details
    console.log("Fetching project details...");
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError) {
      console.error("Project fetch error:", projectError);
      throw new Error(`Failed to fetch project: ${projectError.message}`);
    }

    if (!project) {
      console.error("Project not found");
      throw new Error('Project not found');
    }

    console.log("Project found:", project.title);

    // Fetch existing sections
    console.log("Fetching existing sections...");
    const { data: existingSections, error: sectionsError } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (sectionsError) {
      console.error("Sections fetch error:", sectionsError);
      throw new Error(`Failed to fetch existing sections: ${sectionsError.message}`);
    }

    console.log(`Found ${existingSections?.length || 0} existing sections`);

    // Fetch knowledge base entries
    console.log("Fetching knowledge base entries...");
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('user_id', userId);

    if (knowledgeError) {
      console.error("Knowledge fetch error:", knowledgeError);
      throw new Error(`Failed to fetch knowledge entries: ${knowledgeError.message}`);
    }

    console.log(`Found ${knowledgeEntries?.length || 0} knowledge entries`);

    // Generate simple prompt
    const prompt = `You are an expert proposal writer. Generate content for the "${sectionTitle}" section of a proposal for the project "${project.title}".

Project Details:
- Title: ${project.title}
- Client: ${project.client_name || 'Not specified'}
- Business: ${project.business_name || 'Not specified'}

Requirements:
- Write professional, compelling content
- Keep it concise and relevant
- Do not include section headers
- Focus on the specific section requested

Generate content for: ${sectionTitle}`;

    console.log("Making API call to Anthropic...");

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    console.log("Anthropic API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("Anthropic API response received");
    
    let generatedContent = result.content[0].text;
    
    // Clean the content
    generatedContent = cleanGeneratedContent(generatedContent, sectionTitle);
    
    // Validate content
    const validation = validateContent(generatedContent);
    
    if (!validation.isValid && strictMode) {
      console.error("Content validation failed:", validation.issues);
      throw new Error(`Generated content failed validation: ${validation.issues.join(', ')}`);
    }

    console.log("Content generation successful");

    return new Response(JSON.stringify({ 
      content: generatedContent,
      validation: validation
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-section-content function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

console.log("Function setup complete, listening for requests...");