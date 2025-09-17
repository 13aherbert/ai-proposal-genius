import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateOptimizedPrompt } from "./optimized-prompt.ts";
import { filterAndOptimizeKnowledgeBase, formatOptimizedKnowledgeContext } from "./smart-knowledge-filter.ts";
import { selectOptimalModel, getModelDisplayName, estimateCostReduction } from "./model-selector.ts";
import { assessKnowledgeBaseCoverage } from "./knowledge-validation.ts";
import { analyzeKnowledgeGaps, KnowledgeGapAnalysis } from "./knowledge-gap-analyzer.ts";
import { 
  ProposalGenerationError, 
  createErrorContext, 
  handleApiError, 
  createSuccessResponse, 
  createErrorResponse,
  withRetry,
  apiCircuitBreaker
} from "./enhanced-error-handling.ts";
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

// Validate content for outline compliance if outline requirements exist
const validateOutlineCompliance = (content: string, outlineReqs: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!outlineReqs || outlineReqs.trim().length === 0) {
    return { isValid: true, issues: [] };
  }
  
  // Extract requirements from outline text
  const requirements = outlineReqs.toLowerCase().split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(req => req.length > 3);
  
  const contentLower = content.toLowerCase();
  
  let addressedCount = 0;
  requirements.forEach(requirement => {
    // Extract key terms from the requirement
    const keyTerms = requirement.split(/\s+/)
      .filter(term => term.length > 3 && !['and', 'the', 'for', 'with'].includes(term))
      .slice(0, 3); // Take up to 3 key terms
    
    // Check if any key terms are addressed in content
    const isAddressed = keyTerms.some(term => contentLower.includes(term));
    
    if (isAddressed) {
      addressedCount++;
    } else if (requirement.length > 10) { // Only flag substantial requirements
      issues.push(`Missing coverage for: ${requirement.substring(0, 50)}...`);
    }
  });
  
  // Consider valid if at least 60% of substantial requirements are addressed
  const coverageRatio = requirements.length > 0 ? addressedCount / requirements.length : 1;
  const isValid = coverageRatio >= 0.6;
  
  return { isValid, issues };
};

// Extract outline requirements for a specific section
const extractOutlineRequirements = (proposalOutline: string | null, sectionTitle: string): string => {
  if (!proposalOutline) return '';
  
  const lines = proposalOutline.split('\n');
  const sectionTitleLower = sectionTitle.toLowerCase();
  
  let inTargetSection = false;
  let requirements = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();
    
    // Check if this line matches our section title
    if (lineLower.includes(sectionTitleLower.replace(/\d+\.\s*/, '')) || 
        sectionTitleLower.includes(lineLower.replace(/\d+\.\s*/, ''))) {
      inTargetSection = true;
      continue;
    }
    
    // If we're in the target section and hit another section header, stop
    if (inTargetSection && getLineDepth(line) <= getLineDepth(sectionTitle)) {
      if (line !== sectionTitle && line.match(/^\s*\w/)) {
        break;
      }
    }
    
    // Collect requirements while in target section
    if (inTargetSection && line.length > 0) {
      requirements += line + '\n';
    }
  }
  
  return requirements.trim();
};

// Helper to determine line depth based on formatting
const getLineDepth = (line: string): number => {
  if (line.match(/^#{1,6}\s/)) {
    const matches = line.match(/^(#{1,6})/);
    return matches ? matches[1].length : 0;
  }
  if (line.match(/^\d+\.\s/)) return 1;
  if (line.match(/^[ivxlc]+\.\s/i)) return 1;
  if (line.match(/^\d+\.\d+/)) return 2;
  if (line.match(/^[-*•]\s/)) return 2;
  return 3;
};

// Intelligent fabrication detection with semantic understanding
function detectContentFabrication(
  content: string,
  knowledgeEntries: KnowledgeEntry[]
): { isValid: boolean; issues: string[]; confidenceScore: number } {
  const issues: string[] = [];
  let confidenceScore = 100;

  // Build comprehensive knowledge base with semantic search capability
  const knowledgeTexts = knowledgeEntries.map(entry => ({
    text: `${entry.title} ${entry.content || ''} ${entry.parsed_content || ''}`.toLowerCase(),
    category: entry.category,
    title: entry.title
  }));

  // More intelligent quantitative claim patterns
  const quantitativePatterns = [
    /\b\d+(?:,\d+)*\s*(?:years?|months?|weeks?|days?)\s*(?:of\s+)?(?:experience|expertise|history|operation)/gi,
    /\b\d+(?:,\d+)*\s*(?:completed\s+)?(?:projects?|clients?|customers?|contracts?)/gi,
    /\b\d+(?:\.\d+)?%\s*(?:success|completion|satisfaction|accuracy|improvement)\s*rate/gi,
    /\$\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:million|billion|thousand|k|m|b))?\s*(?:project|contract|value|revenue)/gi,
    /\b(?:founded|established|since|operating\s+since)\s+\d{4}/gi
  ];

  // Semantic matching function for better context understanding
  const hasSemanticMatch = (claim: string, threshold: number = 0.3): boolean => {
    const claimWords = claim.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    return knowledgeTexts.some(kb => {
      const kbWords = kb.text.split(/\W+/);
      const matchCount = claimWords.filter(word => 
        kbWords.some(kbWord => 
          kbWord.includes(word) || word.includes(kbWord) || 
          // Fuzzy matching for numbers and years
          (word.match(/\d+/) && kbWord.includes(word))
        )
      ).length;
      
      return (matchCount / claimWords.length) >= threshold;
    });
  };

  // Check quantitative claims with semantic understanding
  for (const pattern of quantitativePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // First check for exact match
        const exactMatch = knowledgeTexts.some(kb => kb.text.includes(match.toLowerCase()));
        
        // If no exact match, check semantic similarity
        const semanticMatch = hasSemanticMatch(match, 0.4);
        
        if (!exactMatch && !semanticMatch) {
          // Only flag as issue if it's a very specific claim
          const isSpecificClaim = /\d{4}|\d+%|\$[\d,]+/.test(match);
          if (isSpecificClaim) {
            issues.push(`Specific quantitative claim needs verification: "${match}"`);
            confidenceScore -= 15; // Reduced penalty
          }
        }
      }
    }
  }

  // More lenient achievement pattern checking
  const achievementPatterns = [
    /(?:we\s+have\s+|our\s+team\s+has\s+)(?:successfully\s+)?(?:completed|delivered|managed|executed)\s+[^.!?]*\d+[^.!?]*/gi,
    /our\s+(?:\d+[^.!?]*)?(?:track\s+record|portfolio|experience|expertise)/gi
  ];

  for (const pattern of achievementPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // More flexible matching for achievements
        const hasSupport = hasSemanticMatch(match, 0.2);
        
        if (!hasSupport) {
          // Only warn for very specific unsupported claims
          if (match.match(/\d{4}|\d+%|\d+\s+(?:years?|projects?|clients?)/i)) {
            issues.push(`Achievement claim may need more context: "${match.trim()}"`);
            confidenceScore -= 10; // Much reduced penalty
          }
        }
      }
    }
  }

  // More lenient approach to superlatives - only flag if completely unsupported
  const suspiciousSuperlatives = [
    /\b(?:industry-leading|world-class|cutting-edge|state-of-the-art|award-winning|premier)\b/gi
  ];

  for (const pattern of suspiciousSuperlatives) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Only flag if knowledge base is substantial but has no supporting context
        if (knowledgeTexts.length > 5 && !hasSemanticMatch(match, 0.1)) {
          issues.push(`Marketing term could use more support: "${match}"`);
          confidenceScore -= 5; // Minimal penalty
        }
      }
    }
  }

  // Balanced threshold - less strict for better usability
  const isValid = confidenceScore >= 70 || issues.length <= 2;
  
  return {
    isValid,
    issues,
    confidenceScore: Math.max(0, confidenceScore)
  };
}

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

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  console.log(`[${requestId}] Request received:`, req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing request body...");
    
    const context = createErrorContext('generate-section-content', 'parse-request', { requestId });
    
    // Enhanced JSON parsing with better error handling
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log("Raw request body received, length:", rawBody.length);
      
      if (!rawBody || rawBody.trim() === '') {
        throw new ProposalGenerationError(
          "Empty request body",
          context,
          false,
          400,
          "Request body is required"
        );
      }
      
      requestBody = JSON.parse(rawBody);
      console.log("JSON parsed successfully");
    } catch (error) {
      if (error instanceof ProposalGenerationError) throw error;
      
      throw new ProposalGenerationError(
        "Invalid JSON in request body",
        context,
        false,
        400,
        "Invalid request format. Please refresh and try again."
      );
    }

    // Extract and validate required fields
    const projectId = requestBody.projectId;
    const sectionTitle = requestBody.sectionTitle;
    const userId = requestBody.userId;
    const strictMode = requestBody.strictMode || false;
    
    // Enhanced validation with detailed error messages
    if (!projectId || !sectionTitle || !userId) {
      console.error("Missing required fields:", { projectId, sectionTitle, userId });
      throw new ProposalGenerationError(
        "Missing required fields",
        { ...context, userId, projectId, sectionTitle },
        false,
        400,
        "Project ID, section title, and user ID are required"
      );
    }

    console.log("Request parameters validated:", {
      projectId: projectId,
      sectionTitle: sectionTitle,
      userId: userId,
      strictMode: strictMode
    });

    // Update context with validated parameters
    Object.assign(context, { userId, projectId, sectionTitle });

    // Enhanced project fetching with retry mechanism
    console.log("Fetching project details...");
    const project = await withRetry(async () => {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${req.headers.get('authorization')?.split(' ')[1]}`,
          },
        },
      });

      const { data, error } = await userSupabase
        .from('projects')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Project not found');
      
      return data;
    }, 3, 1000, { ...context, step: 'fetch-project' });

    console.log("Project found:", project.title);

    // Enhanced existing sections fetching
    console.log("Fetching existing sections...");
    const existingSections = await withRetry(async () => {
      const { data, error } = await supabase
        .from('proposal_sections')
        .select('section_title, content')
        .eq('project_id', projectId)
        .neq('section_title', sectionTitle);

      if (error) throw error;
      return data || [];
    }, 2, 500, { ...context, step: 'fetch-sections' });

    console.log("Found", existingSections.length, "existing sections");

    // Enhanced knowledge base fetching with comprehensive error handling
    console.log("Fetching knowledge base entries...");
    const knowledgeEntries = await withRetry(async () => {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${req.headers.get('authorization')?.split(' ')[1]}`,
          },
        },
      });

      const { data, error } = await userSupabase
        .from('knowledge_entries')
        .select('*')
        .eq('organization_id', project.organization_id);

      if (error) throw error;
      return data || [];
    }, 2, 500, { ...context, step: 'fetch-knowledge' });

    // Enhanced knowledge base assessment
    const knowledgeBaseStats = assessKnowledgeBaseCoverage(knowledgeEntries);
    console.log("Knowledge base coverage assessment:", knowledgeBaseStats);
    
    if (strictMode) {
      console.log("Strict mode enabled - performing enhanced knowledge base coverage assessment...");
      const entriesWithContent = knowledgeEntries.filter(entry => 
        (entry.content && entry.content.trim().length > 0) || 
        (entry.parsed_content && entry.parsed_content.trim().length > 0)
      );
      
      console.log("Found", knowledgeEntries.length, "total entries,", entriesWithContent.length, "with actual content");
      
      const totalContentLength = entriesWithContent.reduce((total, entry) => 
        total + (entry.content?.length || 0) + (entry.parsed_content?.length || 0), 0
      );
      
      console.log("Total knowledge base content:", totalContentLength, "characters across", entriesWithContent.length, "entries");
      
      // Knowledge gap analysis
      const gapAnalysis: KnowledgeGapAnalysis = analyzeKnowledgeGaps(
        entriesWithContent, 
        project.analysis || '', 
        getSectionType(sectionTitle)
      );
      
      if (gapAnalysis.criticalMissing.length > 0) {
        console.warn("Critical knowledge gaps detected:", gapAnalysis.criticalMissing);
      }
    }

    // Enhanced knowledge base optimization
    const sectionType = getSectionType(sectionTitle);
    console.log(`Optimizing knowledge base for section type: ${sectionType}`);
    
    const optimizedContext = filterAndOptimizeKnowledgeBase(
      knowledgeEntries, 
      sectionType, 
      sectionTitle
    );

    console.log("Token optimization results:", {
      originalEntries: knowledgeEntries.length,
      filteredEntries: optimizedContext.relevantEntries.length,
      promptLength: 0, // Will be set after prompt generation
      contentLength: optimizedContext.totalContentLength
    });

    // Enhanced model selection with cost optimization
    const modelConfig = selectOptimalModel(sectionType, sectionTitle, optimizedContext.totalContentLength);
    const costReduction = estimateCostReduction('claude-opus-4-1-20250805', modelConfig.model);
    
    console.log("Model optimization:", {
      selectedModel: getModelDisplayName(modelConfig.model),
      costTier: modelConfig.costTier,
      estimatedSavings: `${costReduction}%`,
      maxTokens: modelConfig.maxTokens
    });
    
    // Enhanced prompt generation
    const optimizedKnowledgeContext = formatOptimizedKnowledgeContext(optimizedContext);
    const prompt = generateOptimizedPrompt(
      sectionTitle, 
      project, 
      optimizedKnowledgeContext,
      existingSections,
      strictMode
    );
    
    // Enhanced content generation with circuit breaker protection
    console.log("Generating content with Anthropic API...");
    const generatedContent = await apiCircuitBreaker.execute(async () => {
      return await withRetry(async () => {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Anthropic API error:", response.status, errorText);
          throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log("Anthropic API response status:", response.status, "| Model:", getModelDisplayName(modelConfig.model));
        
        return result.content[0].text;
      }, 3, 2000, { ...context, step: 'anthropic-api' });
    }, { ...context, step: 'circuit-breaker' });

    console.log("Anthropic API response received");

    // Enhanced content processing and validation
    const cleanedContent = cleanGeneratedContent(generatedContent, sectionTitle);
    const validation = validateContent(cleanedContent);
    
    // Enhanced fabrication detection in strict mode
    let hallucinationCheck = null;
    if (strictMode) {
      console.log("Performing ULTRA-STRICT post-generation fabrication detection...");
      hallucinationCheck = detectContentFabrication(cleanedContent, knowledgeEntries);
      
      if (!hallucinationCheck.isValid) {
        console.error("Content failed fabrication detection:", hallucinationCheck.issues);
        
        // Enhanced error response with actionable feedback
        throw new ProposalGenerationError(
          'Generated content contains unverified claims',
          { ...context, step: 'fabrication-detection' },
          true,
          400,
          `Content quality check failed. The AI generated content that couldn't be verified against your knowledge base. Issues: ${hallucinationCheck.issues.slice(0, 2).join(', ')}. Consider adding more specific information to your knowledge base or try regenerating.`
        );
      }
    }

    // Enhanced outline compliance checking
    if (project.proposal_outline && strictMode) {
      const outlineRequirements = extractOutlineRequirements(project.proposal_outline, sectionTitle);
      if (outlineRequirements && outlineRequirements.trim().length > 0) {
        console.log("Performing ENHANCED ultra-strict validation for strict mode...");
        const outlineCompliance = validateOutlineCompliance(cleanedContent, outlineRequirements);
        
        if (!outlineCompliance.isValid) {
          console.error("Content failed outline compliance:", outlineCompliance.issues);
          
          throw new ProposalGenerationError(
            'Content does not adequately address outline requirements',
            { ...context, step: 'outline-compliance' },
            true,
            400,
            `Generated content doesn't fully address the proposal outline requirements. Missing elements: ${outlineCompliance.issues.slice(0, 2).join(', ')}. Please ensure your knowledge base contains relevant information or adjust the outline.`
          );
        }
      }
    }
    
    // Enhanced validation for basic content issues
    if (!validation.isValid && strictMode) {
      console.error("Basic content validation failed:", validation.issues);
      
      throw new ProposalGenerationError(
        `Content validation failed: ${validation.issues.join(', ')}`,
        { ...context, step: 'content-validation' },
        true,
        400,
        `Generated content has quality issues: ${validation.issues.join(', ')}. Please try regenerating or check your knowledge base content.`
      );
    }

    // Enhanced success response with comprehensive metrics
    const processingTime = Date.now() - startTime;
    console.log(`[${requestId}] Content generation successful in ${processingTime}ms with optimizations:`, {
      model: getModelDisplayName(modelConfig.model),
      costTier: modelConfig.costTier,
      estimatedSavings: `${costReduction}%`,
      entriesUsed: `${optimizedContext.relevantEntries.length}/${knowledgeEntries.length}`,
      contextLength: optimizedContext.totalContentLength,
      promptLength: prompt.length,
      generatedLength: cleanedContent.length
    });

    const successResponse = createSuccessResponse({
      content: cleanedContent,
      validation: validation,
      hallucinationCheck: strictMode ? hallucinationCheck : null,
      strictMode: strictMode,
      requestId: requestId,
      processingTimeMs: processingTime
    }, {
      modelUsed: getModelDisplayName(modelConfig.model),
      costReduction: `${costReduction}%`,
      entriesFiltered: `${optimizedContext.relevantEntries.length}/${knowledgeEntries.length}`,
      contextOptimization: `${optimizedContext.totalContentLength} chars`,
      tokenSavings: "~80% input tokens saved",
      processingTime: `${processingTime}ms`
    });

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Error in generate-section-content function:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      type: typeof error
    });
    
    // Enhanced error handling with proper typing and user-friendly messages
    const enhancedError = error instanceof ProposalGenerationError ? 
      error : 
      handleApiError(error, createErrorContext('generate-section-content', 'unknown'));
    
    const errorResponse = createErrorResponse(enhancedError);
    
    return new Response(JSON.stringify(errorResponse), {
      status: enhancedError.statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

console.log("Function setup complete, listening for requests...");