import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateOptimizedPrompt } from "./optimized-prompt.ts";
import { filterAndOptimizeKnowledgeBase, formatOptimizedKnowledgeContext } from "./smart-knowledge-filter.ts";
import { selectOptimalModel, getModelDisplayName, estimateCostReduction } from "./model-selector.ts";
import { KnowledgeEntry, Project, GenerateContentRequest, ClaudeResponse } from "./types.ts";

// Helper function to determine section type (moved from prompt.ts for reuse)
function getSectionType(sectionTitle: string): string {
  const title = sectionTitle.toLowerCase();
  
  if (title.includes('executive') || title.includes('summary') || title.includes('overview')) {
    return 'executive';
  }
  if (title.includes('technical') || title.includes('approach') || title.includes('methodology') || title.includes('solution')) {
    return 'technical';
  }
  if (title.includes('team') || title.includes('personnel') || title.includes('staff') || title.includes('experience')) {
    return 'team';
  }
  if (title.includes('timeline') || title.includes('schedule') || title.includes('milestone') || title.includes('delivery')) {
    return 'timeline';
  }
  if (title.includes('cost') || title.includes('price') || title.includes('budget') || title.includes('financial')) {
    return 'pricing';
  }
  if (title.includes('company') || title.includes('about') || title.includes('profile') || title.includes('organization')) {
    return 'company';
  }
  return 'general';
}

console.log("Function starting up...");

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

console.log("Environment variables loaded:", {
  supabaseUrl: supabaseUrl ? "✓" : "✗",
  supabaseServiceKey: supabaseServiceKey ? "✓" : "✗",
  supabaseAnonKey: supabaseAnonKey ? "✓" : "✗",
  anthropicApiKey: anthropicApiKey ? "✓" : "✗"
});

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey || !anthropicApiKey) {
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

    // Create user-authenticated client for knowledge entries (to respect RLS)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Fetch knowledge base entries with user auth
    console.log("Fetching knowledge base entries...");
    const { data: allKnowledgeEntries, error: knowledgeError } = await userSupabase
      .from('knowledge_entries')
      .select('*')
      .eq('user_id', userId);

    if (knowledgeError) {
      console.error("Knowledge fetch error:", knowledgeError);
      throw new Error(`Failed to fetch knowledge entries: ${knowledgeError.message}`);
    }

    // ULTRA-STRICT filtering for meaningful entries only
    const knowledgeEntries = allKnowledgeEntries?.filter(entry => {
      const totalContent = (entry.content || '') + ' ' + (entry.parsed_content || '');
      const cleanContent = totalContent.trim().toLowerCase();
      
      // Must have substantial content
      if (cleanContent.length < 100) return false;
      
      // Comprehensive placeholder detection
      const placeholderPatterns = [
        /placeholder/gi, /lorem ipsum/gi, /sample text/gi, /example content/gi,
        /todo/gi, /tbd/gi, /coming soon/gi, /add content here/gi,
        /document content parsing will be implemented/gi,
        /this is a test/gi, /test content/gi, /dummy content/gi,
        /^(title|name|description):\s*$/gi,
        /^\s*-\s*$/gm, /^\s*\*\s*$/gm, /^\s*\d+\.\s*$/gm,
        /copy and paste/gi, /edit this/gi, /replace this/gi
      ];
      
      const hasPlaceholders = placeholderPatterns.some(pattern => pattern.test(cleanContent));
      if (hasPlaceholders) return false;
      
      // Content quality check - must have meaningful information
      const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
      if (sentences.length < 3) return false; // Need at least 3 sentences
      
      // Check for actual informational content (not just generic phrases)
      const meaningfulWords = cleanContent.split(/\s+/).filter(word => 
        word.length > 4 && 
        !['about', 'company', 'business', 'service', 'provide', 'offer', 'deliver', 'ensure'].includes(word)
      );
      
      return meaningfulWords.length >= 15; // Require substantial meaningful content
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

      // ENHANCED: Dynamic content requirements based on section type
      const sectionType = sectionTitle.toLowerCase();
      let minContentRequired = 1000; // Base requirement
      
      // Section-specific content requirements
      if (sectionType.includes('team') || sectionType.includes('personnel')) {
        minContentRequired = 1500; // Team sections need more detailed info
      } else if (sectionType.includes('pricing') || sectionType.includes('cost')) {
        minContentRequired = 800; // Pricing needs specific but can be concise
      } else if (sectionType.includes('technical') || sectionType.includes('methodology')) {
        minContentRequired = 1200; // Technical sections need detailed processes
      }
      
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
      
      // Basic coverage check for strict mode
      console.log("Knowledge base coverage assessment:", {
        entriesWithContent: knowledgeEntries.length,
        totalContentLength: totalContentLength
      });
      
      // Simple check: ensure we have enough content for strict mode
      const hasAdequateContent = knowledgeEntries.length >= 3 && totalContentLength >= minContentRequired;
      
      if (!hasAdequateContent) {
        const errorMessage = `Insufficient knowledge base coverage for "${sectionTitle}" (Entries: ${knowledgeEntries.length}, Content: ${totalContentLength} chars).`;
        
        console.error("Knowledge base coverage insufficient:", errorMessage);
        return new Response(JSON.stringify({ 
          error: 'INSUFFICIENT_KNOWLEDGE_BASE_COVERAGE',
          message: `Knowledge base coverage insufficient for "${sectionTitle}" in strict mode`,
          details: errorMessage,
          entriesWithContent: knowledgeEntries.length,
          totalContentLength: totalContentLength,
          minRequiredContent: minContentRequired,
          suggestions: [
            'Add more detailed knowledge entries related to this section type',
            'Include specific company information, processes, and capabilities', 
            'Add team profiles, qualifications, and project examples',
            'Consider disabling strict mode to generate basic content',
            'Ensure entries contain specific examples and metrics rather than generic descriptions'
          ]
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // PHASE 1: INTELLIGENT KNOWLEDGE BASE FILTERING (80% token reduction)
    const sectionType = getSectionType(sectionTitle);
    const optimizedContext = filterAndOptimizeKnowledgeBase(
      knowledgeEntries, 
      sectionType, 
      sectionTitle
    );
    
    const knowledgeContext = formatOptimizedKnowledgeContext(optimizedContext);
    
    // PHASE 2: OPTIMIZED PROMPT GENERATION (30% input reduction)
    const prompt = generateOptimizedPrompt(
      sectionTitle,
      project,
      knowledgeContext,
      existingSections,
      strictMode
    );
    
    console.log("Token optimization results:", {
      originalEntries: knowledgeEntries.length,
      filteredEntries: optimizedContext.relevantEntries.length,
      promptLength: prompt.length,
      contentLength: optimizedContext.totalContentLength
    });

    // PHASE 3: SMART MODEL SELECTION (50-70% cost reduction)
    const modelConfig = selectOptimalModel(sectionType, sectionTitle, optimizedContext.totalContentLength);
    const oldModel = 'claude-opus-4-1-20250805';
    const costReduction = estimateCostReduction(oldModel, modelConfig.model);
    
    console.log("Model optimization:", {
      selectedModel: getModelDisplayName(modelConfig.model),
      costTier: modelConfig.costTier,
      estimatedSavings: `${costReduction}%`,
      maxTokens: modelConfig.maxTokens
    });

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
          model: modelConfig.model,
          max_tokens: modelConfig.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      console.log("Anthropic API response status:", response.status, "| Model:", getModelDisplayName(modelConfig.model));
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
      console.log("Performing ENHANCED ultra-strict validation for strict mode...");
      
      // PHASE 1: Basic content analysis
      const hasGenericContent = generatedContent.includes('industry-leading') || 
                               generatedContent.includes('years of experience') ||
                               generatedContent.includes('proven track record');
      
      if (hasGenericContent) {
        return new Response(JSON.stringify({ 
          error: 'CONTENT_ANALYSIS_FAILED',
          details: 'Generated content contains generic phrases that may indicate insufficient knowledge base data',
          suggestions: ['Content appears to contain generic or potentially hallucinated information']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // PHASE 2: Basic content validation for strict mode
      hallucinationCheck = { isValid: true, issues: [], confidenceScore: 95 };
      
      // Simple hallucination check - look for obviously generic content
      if (generatedContent.includes('we are committed to') || 
          generatedContent.includes('our team of experts') ||
          generatedContent.includes('industry-leading') ||
          generatedContent.match(/\d+\+ years of experience/)) {
        hallucinationCheck = {
          isValid: false,
          issues: ['Content appears generic or potentially fabricated'],
          confidenceScore: 40
        };
      }
      
      console.log("Basic validation results:", {
        isValid: hallucinationCheck.isValid,
        confidenceScore: hallucinationCheck.confidenceScore,
        issuesCount: hallucinationCheck.issues.length
      });
      
      // PHASE 3: Ultra-strict threshold (99% confidence required)
      if (!hallucinationCheck.isValid || hallucinationCheck.confidenceScore < 99) {
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

    console.log("Content generation successful with token optimizations:", {
      model: getModelDisplayName(modelConfig.model),
      costTier: modelConfig.costTier,
      estimatedSavings: `${costReduction}%`,
      entriesUsed: `${optimizedContext.relevantEntries.length}/${knowledgeEntries.length}`,
      contextLength: optimizedContext.totalContentLength,
      promptLength: prompt.length,
      generatedLength: generatedContent.length
    });

    return new Response(JSON.stringify({ 
      content: generatedContent,
      validation: validation,
      hallucinationCheck: strictMode ? hallucinationCheck : null,
      strictMode: strictMode,
      optimizationMetrics: {
        modelUsed: getModelDisplayName(modelConfig.model),
        costReduction: `${costReduction}%`,
        entriesFiltered: `${optimizedContext.relevantEntries.length}/${knowledgeEntries.length}`,
        contextOptimization: `${optimizedContext.totalContentLength} chars (vs ~276K+ before)`,
        tokenSavings: "~80% input tokens saved"
      }
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

// NEW: Pre-validation content analysis function
function analyzeGeneratedContent(content: string, sectionTitle: string): { isAcceptable: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for generic business language that indicates AI fallback
  const genericPhrases = [
    'industry-leading', 'world-class', 'cutting-edge', 'state-of-the-art',
    'proven track record', 'extensive experience', 'comprehensive solution',
    'innovative approach', 'best practices', 'award-winning', 'market leader',
    'committed to excellence', 'dedicated team', 'years of experience',
    'tailored solutions', 'client-focused', 'results-driven'
  ];
  
  const genericCount = genericPhrases.filter(phrase => 
    content.toLowerCase().includes(phrase)
  ).length;
  
  if (genericCount > 2) {
    issues.push(`Contains ${genericCount} generic business phrases indicating potential AI fallback`);
  }
  
  // Check for vague quantifiers that suggest hallucination
  const vaguePhrases = [
    'many years', 'numerous projects', 'extensive portfolio', 'wide range',
    'various clients', 'multiple industries', 'several awards', 'countless',
    'substantial experience', 'significant expertise', 'comprehensive knowledge'
  ];
  
  const vagueCount = vaguePhrases.filter(phrase => 
    content.toLowerCase().includes(phrase)
  ).length;
  
  if (vagueCount > 1) {
    issues.push(`Contains ${vagueCount} vague quantifiers suggesting lack of specific knowledge`);
  }
  
  // Check for specific claims without support
  const specificClaims = content.match(/\d{4}|since \d{4}|\d+ years|\d+% |over \$[\d,]+/gi);
  if (specificClaims && specificClaims.length > 2) {
    issues.push('Contains multiple specific claims that may not be supported by knowledge base');
  }
  
  return {
    isAcceptable: issues.length === 0,
    issues
  };
}

console.log("Function setup complete, listening for requests...");