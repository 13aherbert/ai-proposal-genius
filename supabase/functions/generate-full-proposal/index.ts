import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateWithClaude } from '../generate-section-content/claude-client.ts';
import { MultiModelOrchestrator } from '../generate-section-content/multi-model-orchestrator.ts';
import { DynamicPromptOptimizer } from '../generate-section-content/dynamic-prompt-optimizer.ts';
import { ContentQualityAnalyzer } from '../generate-section-content/content-quality-analyzer.ts';

interface Project {
  project_id: string;
  title: string;
  analysis: string | null;
  proposal_outline: string | null;
  client_name: string | null;
  business_name: string | null;
}

interface KnowledgeEntry {
  entry_id: string;
  title: string;
  content: string | null;
  category: string;
  parsed_content: string | null;
}

interface SectionResult {
  sectionTitle: string;
  content: string;
  quality: any;
  processingTime: number;
}

interface GenerateFullProposalRequest {
  projectId: string;
  userId: string;
  strictMode?: boolean;
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
    JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Extract sections from proposal outline
function extractSections(outline: string): string[] {
  const sections = [];
  const lines = outline.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for section headers (lines that start with numbers, bullets, or are in title case)
    if (trimmed && (
      /^\d+\./.test(trimmed) || 
      /^[-*•]/.test(trimmed) ||
      /^[A-Z][a-z]/.test(trimmed)
    )) {
      // Clean up the section title
      const sectionTitle = trimmed
        .replace(/^\d+\.\s*/, '')
        .replace(/^[-*•]\s*/, '')
        .trim();
      
      if (sectionTitle.length > 3) {
        sections.push(sectionTitle);
      }
    }
  }
  
  // Default sections if outline parsing fails
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

async function generateSectionContent(
  sectionTitle: string,
  project: Project,
  knowledgeContext: string,
  allSections: string[],
  anthropicApiKey: string
): Promise<SectionResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Generating content for section: ${sectionTitle}`);
    
    // Initialize analysis modules
    const promptOptimizer = new DynamicPromptOptimizer();
    const multiModelOrchestrator = new MultiModelOrchestrator();
    const qualityAnalyzer = new ContentQualityAnalyzer();
    
    // Build comprehensive context
    const contextParts = [];
    
    if (project.analysis) {
      contextParts.push(`RFP ANALYSIS:\n${project.analysis}`);
    }
    
    if (knowledgeContext) {
      contextParts.push(`KNOWLEDGE BASE:\n${knowledgeContext}`);
    }
    
    // Add proposal structure context
    contextParts.push(`PROPOSAL STRUCTURE:\n${allSections.join('\n')}`);
    
    const fullContext = contextParts.join('\n\n---\n\n');
    
    // Optimize prompt for full proposal context
    const optimizedPrompt = await promptOptimizer.optimizePrompt(
      sectionTitle,
      fullContext,
      'full_proposal',
      {
        clientName: project.client_name,
        businessName: project.business_name,
        allSections: allSections,
        currentSection: sectionTitle
      }
    );
    
    console.log(`Optimized prompt length: ${optimizedPrompt.length} chars`);
    
    // Generate content using multi-model approach
    const orchestrationResult = await multiModelOrchestrator.orchestrateGeneration(
      optimizedPrompt,
      anthropicApiKey,
      'proposal',
      'moderate'
    );
    
    // Analyze quality
    const qualityMetrics = await qualityAnalyzer.analyzeContent(
      orchestrationResult.finalContent,
      sectionTitle,
      fullContext
    );
    
    const processingTime = Date.now() - startTime;
    
    return {
      sectionTitle,
      content: orchestrationResult.finalContent,
      quality: {
        ...qualityMetrics,
        modelConfidence: orchestrationResult.overallConfidence,
        modelAgreement: orchestrationResult.modelAgreement
      },
      processingTime
    };
    
  } catch (error) {
    console.error(`Error generating section ${sectionTitle}:`, error);
    throw new ProposalGenerationError(`Failed to generate ${sectionTitle}: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    console.log('Starting full proposal generation...');

    // Parse request
    const { projectId, userId, strictMode = false }: GenerateFullProposalRequest = await req.json();

    if (!projectId || !userId) {
      throw new ProposalGenerationError('Missing required parameters: projectId and userId', 400);
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !anthropicApiKey) {
      throw new ProposalGenerationError('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Fetching project data for projectId: ${projectId}`);

    // Update generation status
    await supabase
      .from('projects')
      .update({ 
        auto_generation_status: 'in_progress',
        auto_generation_metadata: { 
          startedAt: new Date().toISOString(),
          userId: userId 
        }
      })
      .eq('project_id', projectId);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id, title, analysis, proposal_outline, client_name, business_name, organization_id')
      .eq('project_id', projectId)
      .single();

    if (projectError || !project) {
      throw new ProposalGenerationError(`Project not found: ${projectError?.message || 'Unknown error'}`);
    }

    // Fetch knowledge base entries for the organization
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('entry_id, title, content, category, parsed_content')
      .eq('organization_id', project.organization_id);

    if (knowledgeError) {
      console.warn('Failed to fetch knowledge entries:', knowledgeError);
    }

    // Build knowledge context
    const knowledgeContext = (knowledgeEntries || [])
      .map((entry: KnowledgeEntry) => {
        const content = entry.parsed_content || entry.content || '';
        return `${entry.title} (${entry.category}):\n${content}`;
      })
      .join('\n\n');

    console.log(`Knowledge context length: ${knowledgeContext.length} characters`);

    // Extract sections from proposal outline
    const sections = extractSections(project.proposal_outline || '');
    console.log(`Extracted ${sections.length} sections:`, sections);

    // Generate all sections in parallel
    const sectionPromises = sections.map(sectionTitle => 
      generateSectionContent(
        sectionTitle,
        project,
        knowledgeContext,
        sections,
        anthropicApiKey
      )
    );

    console.log(`Starting parallel generation of ${sections.length} sections...`);
    const sectionResults = await Promise.all(sectionPromises);

    // Combine sections into full proposal
    const fullProposal = sectionResults
      .map(result => `# ${result.sectionTitle}\n\n${result.content}`)
      .join('\n\n---\n\n');

    // Calculate overall metrics
    const totalProcessingTime = Date.now() - startTime;
    const avgQuality = sectionResults.reduce((sum, result) => sum + result.quality.overallScore, 0) / sectionResults.length;
    const avgConfidence = sectionResults.reduce((sum, result) => sum + result.quality.modelConfidence, 0) / sectionResults.length;

    const generationMetadata = {
      generatedAt: new Date().toISOString(),
      totalProcessingTime,
      sectionsGenerated: sections.length,
      averageQuality: avgQuality,
      averageConfidence: avgConfidence,
      sectionMetrics: sectionResults.map(result => ({
        section: result.sectionTitle,
        quality: result.quality.overallScore,
        confidence: result.quality.modelConfidence,
        processingTime: result.processingTime
      }))
    };

    // Save the generated proposal
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

    console.log(`Full proposal generation completed in ${totalProcessingTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        proposal: fullProposal,
        metadata: generationMetadata,
        sections: sectionResults.map(result => ({
          title: result.sectionTitle,
          content: result.content.substring(0, 200) + '...', // Preview only
          quality: result.quality
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Update status to failed
    try {
      const { projectId } = await req.json();
      if (projectId) {
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
                error: error.message 
              }
            })
            .eq('project_id', projectId);
        }
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    if (error instanceof ProposalGenerationError) {
      return createErrorResponse(error, error.statusCode);
    }
    return createErrorResponse(error);
  }
});