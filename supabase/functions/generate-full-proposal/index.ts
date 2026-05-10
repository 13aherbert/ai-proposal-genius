import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { selectOptimalModel, detectSectionType, calculateCostMetrics, aggregateCostStats, type ModelConfig } from './model-selector.ts';
import { filterKnowledgeForSection, createCompanyProfile, type KnowledgeEntry } from './smart-knowledge-filter.ts';
import { generateOptimizedPrompt, estimateTokenCount, type PromptConfig } from './optimized-prompt.ts';
import { requireUser, userCanAccessProject, forbidden } from "../_shared/auth.ts";

// === ANTHROPIC CLAUDE CLIENT WITH TIERED MODEL SUPPORT ===
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const REQUEST_DELAY = 2500;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWithTieredModel(
  prompt: string, 
  _apiKey: string, // kept for interface compatibility
  modelConfig: ModelConfig,
  retryCount = 0
): Promise<{ content: string; model: string }> {
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  try {
    console.log(`Calling Claude Sonnet for section (original tier: ${modelConfig.costTier}, ${modelConfig.maxTokens} max tokens)`);
    
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: modelConfig.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delayMs = BASE_DELAY * Math.pow(2, retryCount);
        console.log(`Rate limited. Retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await delay(delayMs);
        return generateWithTieredModel(prompt, _apiKey, modelConfig, retryCount + 1);
      }
      
      if (response.status === 402) {
        throw new Error('Payment required - please check your Anthropic billing');
      }
      
      const errorText = await response.text();
      console.error(`Anthropic API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      content: result.content[0].text,
      model: CLAUDE_MODEL
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES && (error.message.includes('network') || error.message.includes('timeout'))) {
      const delayMs = BASE_DELAY * Math.pow(2, retryCount);
      console.log(`Network error. Retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await delay(delayMs);
      return generateWithTieredModel(prompt, _apiKey, modelConfig, retryCount + 1);
    }
    throw error;
  }
}

// === CONTENT QUALITY ANALYZER ===
interface QualityMetrics {
  overallScore: number;
  readabilityScore: number;
  persuasivenessScore: number;
  clientFocusScore: number;
  modelConfidence: number;
  modelAgreement: number;
}

function analyzeContentQuality(content: string): QualityMetrics {
  const readabilityScore = analyzeReadability(content);
  const persuasivenessScore = analyzePersuasiveness(content);
  const clientFocusScore = analyzeClientFocus(content);
  
  const overallScore = Math.round((readabilityScore + persuasivenessScore + clientFocusScore) / 3);
  
  return {
    overallScore,
    readabilityScore,
    persuasivenessScore,
    clientFocusScore,
    modelConfidence: 0.85,
    modelAgreement: 1.0
  };
}

function analyzeReadability(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  return avgWordsPerSentence <= 25 ? 90 : 70;
}

function analyzePersuasiveness(content: string): number {
  const benefitPatterns = /\b(save|reduce|increase|improve|enhance|deliver|achieve|enable|optimize)\b/gi;
  const benefitCount = (content.match(benefitPatterns) || []).length;
  return benefitCount >= 3 ? 85 : 70;
}

function analyzeClientFocus(content: string): number {
  const clientPatterns = /\b(you|your|client|customer|organization)\b/gi;
  const companyPatterns = /\b(we|our|us|company|firm)\b/gi;
  
  const clientCount = (content.match(clientPatterns) || []).length;
  const companyCount = (content.match(companyPatterns) || []).length;
  
  if (clientCount + companyCount === 0) return 75;
  const clientFocusRatio = clientCount / (clientCount + companyCount);
  return clientFocusRatio >= 0.4 ? 85 : 70;
}

// === MAIN INTERFACES ===
interface Project {
  project_id: string;
  title: string;
  analysis: string | null;
  proposal_outline: string | null;
  client_name: string | null;
  business_name: string | null;
  organization_id: string;
}

interface SectionResult {
  sectionTitle: string;
  content: string;
  quality: QualityMetrics;
  processingTime: number;
  modelUsed: string;
  costMetrics: { modelUsed: string; costTier: string; estimatedCostReduction: number };
}

interface GenerateFullProposalRequest {
  projectId: string;
  userId: string;
  strictMode?: boolean;
  sections?: string[];
  chunkIndex?: number;
  totalChunks?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class ProposalGenerationError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ProposalGenerationError';
  }
}

function createErrorResponse(error: Error, statusCode: number = 500) {
  console.error('Full proposal generation error:', error);
  return new Response(
    JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }),
    { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function extractSections(outline: string): string[] {
  const sections = [];
  const lines = outline.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && (
      /^\d+\./.test(trimmed) || 
      /^[-*•]/.test(trimmed) ||
      /^[A-Z][a-z]/.test(trimmed)
    )) {
      const sectionTitle = trimmed
        .replace(/^\d+\.\s*/, '')
        .replace(/^[-*•]\s*/, '')
        .trim();
      
      if (sectionTitle.length > 3) {
        sections.push(sectionTitle);
      }
    }
  }
  
  if (sections.length === 0) {
    return [
      'Executive Summary',
      'Understanding Your Requirements',
      'Our Approach and Methodology',
      'Project Timeline and Deliverables',
      'Team and Qualifications',
      'Budget and Investment',
      'Why Choose Us',
      'Next Steps'
    ];
  }
  
  return sections;
}

async function generateOptimizedSectionContent(
  sectionTitle: string,
  sectionType: string,
  project: Project,
  knowledgeEntries: KnowledgeEntry[],
  allSections: string[],
  existingSections: Map<string, string>,
  lovableApiKey: string
): Promise<SectionResult> {
  const startTime = Date.now();
  
  console.log(`\n=== Generating: ${sectionTitle} (type: ${sectionType}) ===`);
  
  // Step 1: Select optimal model based on section complexity
  const filteredKnowledge = filterKnowledgeForSection(knowledgeEntries, sectionTitle, sectionType);
  const modelConfig = selectOptimalModel(sectionTitle, filteredKnowledge.filteredLength);
  
  // Step 2: Create company profile for context (cached efficiency)
  const companyProfile = createCompanyProfile(knowledgeEntries);
  
  // Step 3: Generate optimized prompt
  const promptConfig: PromptConfig = {
    sectionTitle,
    sectionType,
    rfpContext: project.analysis || '',
    knowledgeContext: companyProfile + '\n' + filteredKnowledge.formattedContext,
    allSections,
    existingSections,
    clientName: project.client_name || undefined,
    businessName: project.business_name || undefined
  };
  
  const optimizedPrompt = generateOptimizedPrompt(promptConfig);
  const estimatedTokens = estimateTokenCount(optimizedPrompt);
  
  console.log(`Prompt stats: ${optimizedPrompt.length} chars, ~${estimatedTokens} tokens`);
  console.log(`Knowledge reduction: ${filteredKnowledge.reductionPercent}%`);
  
  // Step 4: Generate content with selected model
  const result = await generateWithTieredModel(optimizedPrompt, lovableApiKey, modelConfig);
  
  // Step 5: Analyze quality
  const quality = analyzeContentQuality(result.content);
  const costMetrics = calculateCostMetrics(result.model);
  
  const processingTime = Date.now() - startTime;
  
  console.log(`Completed: ${sectionTitle} in ${processingTime}ms, quality: ${quality.overallScore}, cost reduction: ${costMetrics.estimatedCostReduction}%`);
  
  return {
    sectionTitle,
    content: result.content,
    quality,
    processingTime,
    modelUsed: result.model,
    costMetrics
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let requestData: GenerateFullProposalRequest | null = null;
  
  try {
    const startTime = Date.now();
    console.log('Starting optimized full proposal generation...');

    requestData = await req.json();
    const { projectId, strictMode = false, sections: requestedSections, chunkIndex = 0, totalChunks = 1 } = requestData;
    // SECURITY: Always derive userId from validated JWT, never from request body
    const userId = auth.id;

    if (!projectId) {
      throw new ProposalGenerationError('Missing required parameter: projectId', 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
      throw new ProposalGenerationError('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!(await userCanAccessProject(supabase, userId, projectId))) {
      return forbidden('You do not have access to this project');
    }

    console.log(`Fetching project data for projectId: ${projectId}`);

    await supabase
      .from('projects')
      .update({ 
        auto_generation_status: 'in_progress',
        auto_generation_metadata: { 
          startedAt: new Date().toISOString(),
          userId,
          optimizationEnabled: true
        }
      })
      .eq('project_id', projectId);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, title, analysis, proposal_outline, client_name, business_name, organization_id')
      .eq('project_id', projectId)
      .single();

    if (projectError || !project) {
      throw new ProposalGenerationError(`Project not found: ${projectError?.message || 'Unknown error'}`);
    }

    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('entry_id, title, content, category, parsed_content')
      .eq('organization_id', project.organization_id);

    if (knowledgeError) {
      console.warn('Failed to fetch knowledge entries:', knowledgeError);
    }

    const entries: KnowledgeEntry[] = knowledgeEntries || [];
    const originalKnowledgeLength = entries.reduce((total, e) => 
      total + (e.content?.length || 0) + (e.parsed_content?.length || 0), 0);
    
    console.log(`Knowledge base: ${entries.length} entries, ${originalKnowledgeLength} total chars`);

    const allSections = requestedSections || extractSections(project.proposal_outline || '');
    const sections = requestedSections || allSections;
    console.log(`Processing ${sections.length} sections (chunk ${chunkIndex + 1}/${totalChunks})`);

    const sectionResults: SectionResult[] = [];
    const failedSections: Array<{ title: string; error: string }> = [];
    const existingSections = new Map<string, string>();
    const modelsUsed: string[] = [];
    
    let completedSections = 0;

    for (const sectionTitle of sections) {
      try {
        console.log(`\nProcessing section ${completedSections + 1}/${sections.length}: ${sectionTitle}`);
        
        const sectionType = detectSectionType(sectionTitle);
        
        await supabase
          .from('projects')
          .update({ 
            auto_generation_metadata: { 
              startedAt: new Date().toISOString(),
              userId,
              currentSection: sectionTitle,
              sectionType,
              chunkIndex: chunkIndex + 1,
              totalChunks,
              progress: Math.round((completedSections / sections.length) * 100),
              completedSections,
              totalSections: sections.length,
              optimizationEnabled: true
            }
          })
          .eq('project_id', projectId);
        
        const sectionResult = await generateOptimizedSectionContent(
          sectionTitle,
          sectionType,
          project,
          entries,
          allSections,
          existingSections,
          lovableApiKey
        );
        
        sectionResults.push(sectionResult);
        existingSections.set(sectionTitle, sectionResult.content);
        modelsUsed.push(sectionResult.modelUsed);
        completedSections++;
        
        console.log(`Completed: ${sectionTitle} (${completedSections}/${sections.length})`);
        
        if (completedSections < sections.length) {
          console.log(`Waiting ${REQUEST_DELAY}ms before next section...`);
          await delay(REQUEST_DELAY);
        }
        
      } catch (error) {
        console.error(`Failed to generate section "${sectionTitle}":`, error.message);
        
        failedSections.push({ title: sectionTitle, error: error.message });
        
        sectionResults.push({
          sectionTitle,
          content: `[Content for "${sectionTitle}" could not be generated: ${error.message}. Please complete manually.]`,
          quality: {
            overallScore: 0,
            readabilityScore: 0,
            persuasivenessScore: 0,
            clientFocusScore: 0,
            modelConfidence: 0,
            modelAgreement: 0
          },
          processingTime: 0,
          modelUsed: 'none',
          costMetrics: { modelUsed: 'none', costTier: 'none', estimatedCostReduction: 0 }
        });
        
        completedSections++;
        
        if (completedSections < sections.length) {
          await delay(REQUEST_DELAY);
        }
      }
    }

    // Calculate cost optimization stats
    const costStats = aggregateCostStats(modelsUsed.filter(m => m !== 'none'));
    
    const successfulSections = sectionResults.filter(r => r.quality.overallScore > 0);
    
    let fullProposal = sectionResults
      .map(result => `# ${result.sectionTitle}\n\n${result.content}`)
      .join('\n\n---\n\n');
    
    if (failedSections.length > 0) {
      const summarySection = `
# Generation Summary

This proposal was generated with ${successfulSections.length} out of ${sections.length} sections completed.

## Sections Requiring Attention
${failedSections.map(failed => `- **${failed.title}**: ${failed.error}`).join('\n')}

---
      `;
      fullProposal = summarySection + fullProposal;
    }

    const totalProcessingTime = Date.now() - startTime;

    const generationMetadata = {
      generatedAt: new Date().toISOString(),
      totalProcessingTime,
      sectionsGenerated: sections.length,
      sectionsSuccessful: successfulSections.length,
      sectionsFailed: failedSections.length,
      averageQuality: successfulSections.length > 0 
        ? successfulSections.reduce((sum, r) => sum + r.quality.overallScore, 0) / successfulSections.length 
        : 0,
      averageConfidence: successfulSections.length > 0 
        ? successfulSections.reduce((sum, r) => sum + r.quality.modelConfidence, 0) / successfulSections.length 
        : 0,
      sectionMetrics: sectionResults.map(result => ({
        section: result.sectionTitle,
        quality: result.quality.overallScore,
        confidence: result.quality.modelConfidence,
        processingTime: result.processingTime,
        modelUsed: result.modelUsed,
        costTier: result.costMetrics.costTier
      })),
      failedSections,
      // Cost optimization metrics
      costOptimization: {
        enabled: true,
        avgCostReduction: costStats.avgCostReduction,
        modelsUsed: costStats.modelsUsed,
        tierDistribution: costStats.tierDistribution,
        originalKnowledgeLength,
        optimizedContextUsed: true
      }
    };

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        auto_generated_proposal: fullProposal,
        auto_generation_status: 'completed',
        auto_generation_metadata: generationMetadata
      })
      .eq('project_id', projectId);

    if (updateError) {
      throw new ProposalGenerationError(`Failed to save proposal: ${updateError.message}`);
    }

    console.log(`\n=== Generation Complete ===`);
    console.log(`Total time: ${totalProcessingTime}ms`);
    console.log(`Sections: ${successfulSections.length}/${sections.length} successful`);
    console.log(`Cost reduction: ~${costStats.avgCostReduction}% (tier distribution: ${JSON.stringify(costStats.tierDistribution)})`);

    return new Response(
      JSON.stringify({
        success: true,
        proposal: fullProposal,
        metadata: generationMetadata,
        chunkIndex,
        totalChunks,
        isPartial: totalChunks > 1,
        sections: sectionResults.map(result => ({
          title: result.sectionTitle,
          content: result.content.substring(0, 200) + '...',
          quality: result.quality,
          modelUsed: result.modelUsed,
          costTier: result.costMetrics.costTier
        })),
        sectionsData: sectionResults,
        costOptimization: {
          avgCostReduction: costStats.avgCostReduction,
          tierDistribution: costStats.tierDistribution,
          modelsUsed: costStats.modelsUsed
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Full proposal generation error:', error);
    
    if (requestData?.projectId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('projects')
            .update({ 
              auto_generation_status: 'failed',
              auto_generation_metadata: { 
                failedAt: new Date().toISOString(),
                error: error.message || 'Unknown error occurred'
              }
            })
            .eq('project_id', requestData.projectId);
        }
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    if (error instanceof ProposalGenerationError) {
      return createErrorResponse(error, error.statusCode);
    }
    return createErrorResponse(error);
  }
});
