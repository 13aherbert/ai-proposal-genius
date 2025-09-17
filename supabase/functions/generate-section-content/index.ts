import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { generateWithClaude } from './claude-client.ts';
import { generatePrompt } from './prompt.ts';
import { KnowledgeEntry, Project } from './types.ts';
import { ContentQualityAnalyzer } from './content-quality-analyzer.ts';
import { KnowledgeGapDetector } from './knowledge-gap-detector.ts';
import { CompetitiveAnalyzer } from './competitive-analyzer.ts';
import { WinProbabilityCalculator } from './win-probability-calculator.ts';
import { EnhancedValidator } from './enhanced-validator.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple error handling
class ProposalGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProposalGenerationError';
  }
}

function createErrorResponse(error: any, context: any, fallbackMessage: string) {
  return {
    success: false,
    error: error.message || fallbackMessage,
    details: error.name || 'Error'
  };
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

console.log("Function starting up...");
console.log("Environment variables loaded:", {
  supabaseUrl: supabaseUrl ? "✓" : "✗",
  supabaseServiceKey: supabaseServiceKey ? "✓" : "✗",
  supabaseAnonKey: supabaseAnonKey ? "✓" : "✗",
  anthropicApiKey: anthropicApiKey ? "✓" : "✗"
});

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey || !anthropicApiKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log("Supabase client created successfully");

// Simplified validation - just check basics
function validateContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!content || content.trim().length < 50) {
    issues.push("Content is too short (minimum 50 characters)");
  }
  
  if (content.includes('{{') || content.includes('[INSERT') || content.includes('[TODO')) {
    issues.push("Content contains placeholder text");
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Helper function to determine section type (used by optimization modules)
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
  return 'general';
}

// Clean up AI-generated content
function cleanGeneratedContent(content: string, sectionTitle: string): string {
  let cleaned = content.trim();
  
  // Remove section headers that might be duplicated
  const headerPattern = new RegExp(`^#+\\s*${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\n?`, 'im');
  cleaned = cleaned.replace(headerPattern, '');
  
  return cleaned.trim();
}

console.log("Function setup complete, listening for requests...");

serve(async (req) => {
  console.log(`[${crypto.randomUUID()}] Request received: ${req.method} ${req.url}`);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log("Processing request body...");
    const requestBody = await req.text();
    console.log("Raw request body received, length:", requestBody.length);

    let body;
    try {
      body = JSON.parse(requestBody);
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      throw new ProposalGenerationError("Invalid JSON in request body");
    }

    const { projectId, sectionTitle, userId, strictMode = false } = body;

    if (!projectId || !sectionTitle || !userId) {
      throw new ProposalGenerationError("Missing required fields: projectId, sectionTitle, userId");
    }

    console.log("Request parameters validated:", {
      projectId,
      sectionTitle, 
      userId,
      strictMode
    });

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
      throw new ProposalGenerationError("Failed to fetch project details");
    }

    if (!project) {
      throw new ProposalGenerationError("Project not found");
    }

    console.log("Project found:", project.title);

    // Fetch existing sections for consistency
    console.log("Fetching existing sections...");
    const { data: existingSections, error: sectionsError } = await supabase
      .from('proposal_sections')
      .select('section_title, content')
      .eq('project_id', projectId)
      .neq('section_title', sectionTitle);

    if (sectionsError) {
      console.error("Sections fetch error:", sectionsError);
    }

    const sections = existingSections || [];
    console.log("Found", sections.length, "existing sections");

    // Fetch ALL knowledge base entries - no filtering!
    console.log("Fetching knowledge base entries...");
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: req.headers.get('authorization'),
        },
      },
    });

    const { data: knowledgeEntries, error: knowledgeError } = await userSupabase
      .from('knowledge_entries')
      .select('*')
      .eq('organization_id', project.organization_id);

    if (knowledgeError) {
      console.error("Knowledge fetch error:", knowledgeError);
      throw new ProposalGenerationError("Failed to fetch knowledge base entries");
    }

    const entries = knowledgeEntries || [];
    console.log("Total knowledge base entries:", entries.length);

    // Filter entries with actual content
    const entriesWithContent = entries.filter(entry => 
      (entry.content && entry.content.trim().length > 0) || 
      (entry.parsed_content && entry.parsed_content.trim().length > 0)
    );

    console.log("Found", entriesWithContent.length, "entries with content");

    if (entriesWithContent.length === 0) {
      throw new ProposalGenerationError("No knowledge base content available for content generation");
    }

    const totalContentLength = entriesWithContent.reduce((total, entry) => 
      total + (entry.content?.length || 0) + (entry.parsed_content?.length || 0), 0
    );

    console.log("Total knowledge base content:", totalContentLength, "characters");

    // Create comprehensive context with ALL knowledge entries
    const allKnowledgeContent = entriesWithContent.map(entry => {
      const content = entry.parsed_content || entry.content || '';
      return `**${entry.title}** (${entry.category})\n${content}`;
    }).join('\n\n---\n\n');

    // Generate enhanced prompt with full context including RFP analysis
    const prompt = generatePrompt(
      sectionTitle, 
      project, 
      allKnowledgeContent, 
      sections, 
      false // Keep it simple for now
    );

    console.log("Generating content with Anthropic API...");
    
    // Use consistent high-quality model
    const response = await generateWithClaude(prompt, anthropicApiKey);
    
    console.log("Anthropic API response received");

    // Clean and validate content
    const cleanedContent = cleanGeneratedContent(response, sectionTitle);
    const basicValidation = validateContent(cleanedContent);

    if (!basicValidation.isValid) {
      console.error("Basic validation failed:", basicValidation.issues);
      throw new ProposalGenerationError(`Content validation failed: ${basicValidation.issues.join(', ')}`);
    }

    // PHASE 2: Advanced Quality Analysis & Optimization
    const sectionType = getSectionType(sectionTitle);
    
    console.log("Running Phase 2 optimization analysis...");
    
    // 1. Enhanced Content Quality Analysis
    const qualityAnalysis = ContentQualityAnalyzer.analyzeContent(
      cleanedContent, 
      sectionType, 
      project.analysis
    );
    
    // 2. Knowledge Gap Detection
    const knowledgeGapAnalysis = KnowledgeGapDetector.analyzeKnowledgeGaps(
      entriesWithContent,
      sectionType,
      project.analysis
    );
    
    // 3. Competitive Analysis
    const competitiveAnalysis = CompetitiveAnalyzer.analyzeCompetitivePosition(
      entriesWithContent,
      project.analysis,
      sectionType
    );
    
    // 4. Win Probability Calculation
    const winProbability = WinProbabilityCalculator.calculateWinProbability(
      entriesWithContent,
      project.analysis,
      competitiveAnalysis,
      qualityAnalysis.metrics
    );
    
    // 5. Enhanced Validation
    const enhancedValidation = EnhancedValidator.validateContent(
      cleanedContent,
      sectionTitle,
      sectionType,
      project.analysis
    );

    // Check if content meets quality thresholds
    const qualityThreshold = ContentQualityAnalyzer.getQualityThreshold();
    const meetsQualityStandards = qualityAnalysis.passes_threshold && 
                                  enhancedValidation.confidence_score >= 70;

    if (!meetsQualityStandards) {
      console.warn("Content quality below optimal threshold:", {
        qualityScore: qualityAnalysis.metrics.overall_score,
        validationScore: enhancedValidation.confidence_score,
        issues: enhancedValidation.issues.filter(i => i.type === 'critical')
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`Content generation successful in ${processingTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      content: cleanedContent,
      sectionTitle,
      processing: {
        modelUsed: 'claude-opus-4-1-20250805',
        knowledgeEntriesUsed: entriesWithContent.length,
        totalKnowledgeEntries: entries.length,
        contentLength: cleanedContent.length,
        processingTimeMs: processingTime
      },
      // PHASE 2: Optimization Analytics
      optimization: {
        quality_analysis: qualityAnalysis,
        knowledge_gaps: knowledgeGapAnalysis,
        competitive_analysis: competitiveAnalysis,
        win_probability: winProbability,
        enhanced_validation: enhancedValidation,
        meets_quality_standards: meetsQualityStandards,
        phase: 'Phase 2: Optimize for Success'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-section-content function:", error);
    
    const errorResponse = createErrorResponse(
      error,
      {},
      "Content generation failed"
    );

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error instanceof ProposalGenerationError ? (error as any).statusCode || 500 : 500,
    });
  }
});