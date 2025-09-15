import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generatePrompt } from "./prompt.ts";
import { formatKnowledgeBaseContext } from "./knowledge-base.ts";
import { assessKnowledgeBaseCoverage, validateGeneratedContent } from "./knowledge-validation.ts";

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
  id: string;
  title: string; 
  content: string | null;
  category: string;
  parsed_content: string | null;
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
    const { data: allKnowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('user_id', userId);

    if (knowledgeError) {
      console.error("Knowledge fetch error:", knowledgeError);
      throw new Error(`Failed to fetch knowledge entries: ${knowledgeError.message}`);
    }

    // Filter out empty entries - critical for strict mode anti-hallucination
    const knowledgeEntries = allKnowledgeEntries?.filter(entry => {
      const hasContent = (entry.content && entry.content.trim().length > 0) ||
                        (entry.parsed_content && 
                         entry.parsed_content.trim().length > 0 && 
                         !entry.parsed_content.includes('Document content parsing will be implemented') &&
                         !entry.parsed_content.includes('placeholder'));
      return hasContent;
    }) || [];

    console.log(`Found ${allKnowledgeEntries?.length || 0} total entries, ${knowledgeEntries.length} with actual content`);

    // Validate API key format
    if (!anthropicApiKey.startsWith('sk-ant-')) {
      console.error("Invalid Anthropic API key format");
      throw new Error('Invalid Anthropic API key format');
    }

    // PHASE 1: PRE-GENERATION VALIDATION (Enhanced for Strict Mode)
    if (strictMode) {
      console.log("Strict mode enabled - performing enhanced knowledge base coverage assessment...");
      
      // Calculate total content volume
      const totalContentLength = knowledgeEntries.reduce((total, entry) => {
        const contentLength = (entry.content?.trim().length || 0) + (entry.parsed_content?.trim().length || 0);
        return total + contentLength;
      }, 0);

      console.log(`Total knowledge base content: ${totalContentLength} characters across ${knowledgeEntries.length} entries`);

      // Require minimum content volume for strict mode
      const minContentRequired = 1000; // Minimum 1000 characters of actual content
      if (totalContentLength < minContentRequired) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient knowledge base content for strict mode',
            message: `Only ${totalContentLength} characters of content available. Strict mode requires at least ${minContentRequired} characters of actual knowledge base content.`,
            suggestion: 'Add more detailed content to your knowledge base entries before using strict mode.',
            entriesWithContent: knowledgeEntries.length,
            totalEntries: allKnowledgeEntries?.length || 0
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      const coverage = assessKnowledgeBaseCoverage(sectionTitle, knowledgeEntries);
      
      console.log("Knowledge base coverage assessment:", {
        isAdequate: coverage.isAdequate,
        coverageScore: coverage.coverageScore,
        relevantEntries: coverage.relevantEntries.length,
        missingTopics: coverage.missingTopics.length,
        contentVolume: totalContentLength
      });
      
      // Enforce ultra-strict thresholds in strict mode
      if (!coverage.isAdequate) {
        const errorMessage = `Insufficient knowledge base coverage for "${sectionTitle}" (Score: ${coverage.coverageScore}%, Content: ${totalContentLength} chars). 
        
To enable content generation in strict mode, please:
${coverage.recommendations.map(rec => `• ${rec}`).join('\n')}

Missing topics: ${coverage.missingTopics.join(', ')}`;
        
        console.error("Knowledge base coverage insufficient:", errorMessage);
        return new Response(JSON.stringify({ 
          error: 'INSUFFICIENT_KNOWLEDGE_BASE_COVERAGE',
          details: errorMessage,
          coverage: coverage,
          contentVolume: totalContentLength,
          entriesWithContent: knowledgeEntries.length
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Format knowledge base context
    const knowledgeContext = formatKnowledgeBaseContext(knowledgeEntries);
    
    // Generate enhanced prompt using knowledge base and existing sections
    const prompt = generatePrompt(
      sectionTitle,
      project,
      knowledgeContext,
      existingSections,
      strictMode
    );
    
    console.log("Generated prompt length:", prompt.length, "characters");

    const model = 'claude-3-5-sonnet-20241022';
    console.log("Making API call to Anthropic with model:", model);

    let response;
    try {
      // Call Anthropic API
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
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
    } catch (fetchError) {
      console.error("Network error calling Anthropic API:", fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Invalid Anthropic API key');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later');
      } else if (response.status >= 500) {
        throw new Error('Anthropic API server error. Please try again later');
      } else {
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }
    }

    const result = await response.json();
    console.log("Anthropic API response received");
    
    let generatedContent = result.content[0].text;
    
    // Check for explicit refusal in strict mode
    if (strictMode && generatedContent.includes('INSUFFICIENT_KNOWLEDGE_BASE_DATA')) {
      console.log("AI refused to generate due to insufficient knowledge base data");
      return new Response(JSON.stringify({ 
        error: 'INSUFFICIENT_KNOWLEDGE_BASE_DATA',
        details: 'The AI determined there is insufficient information in the knowledge base to generate accurate content for this section. Please add more relevant knowledge base entries.',
        recommendations: ['Add specific information about your company, processes, or experience relevant to this section type']
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Clean the content
    generatedContent = cleanGeneratedContent(generatedContent, sectionTitle);
    
    // PHASE 3: POST-GENERATION VALIDATION (Enhanced for Strict Mode)
    let validation = validateContent(generatedContent);
    let hallucinationCheck = { isValid: true, issues: [], confidenceScore: 100 };
    
    if (strictMode) {
      console.log("Performing ultra-strict validation for strict mode...");
      hallucinationCheck = validateGeneratedContent(generatedContent, knowledgeEntries);
      
      console.log("Hallucination check results:", {
        isValid: hallucinationCheck.isValid,
        confidenceScore: hallucinationCheck.confidenceScore,
        issuesCount: hallucinationCheck.issues.length
      });
      
      // Ultra-strict mode: Reject content with any validation issues
      if (!hallucinationCheck.isValid) {
        const errorMessage = `Generated content failed ultra-strict validation (Confidence: ${hallucinationCheck.confidenceScore}%).
        
Issues detected:
${hallucinationCheck.issues.map(issue => `• ${issue}`).join('\n')}

This indicates the content contains information not supported by your knowledge base. Please add more specific, detailed information to your knowledge base and try again.`;

        console.error("Content failed ultra-strict validation:", errorMessage);
        return new Response(JSON.stringify({ 
          error: 'CONTENT_VALIDATION_FAILED',
          details: errorMessage,
          validation: hallucinationCheck,
          suggestions: [
            'Add more detailed, specific content to your knowledge base',
            'Ensure all company information, processes, and capabilities are documented',
            'Include specific examples, metrics, and data points in your knowledge entries'
          ]
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Basic validation (length, placeholders)
    if (!validation.isValid && strictMode) {
      console.error("Basic content validation failed:", validation.issues);
      throw new Error(`Generated content failed basic validation: ${validation.issues.join(', ')}`);
    }

    console.log("Content generation successful with all validations passed");

    return new Response(JSON.stringify({ 
      content: generatedContent,
      validation: validation,
      hallucinationCheck: strictMode ? hallucinationCheck : null,
      strictMode: strictMode
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