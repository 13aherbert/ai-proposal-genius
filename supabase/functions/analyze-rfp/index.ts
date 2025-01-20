import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from './config';
import { AnalyzeRequest, ApiResponse, ApiError } from './types';
import { getKnowledgeBaseEntries, getProjectInfo, downloadRFPFile } from './database';
import { generateAnalysisPrompt } from './prompts';
import { analyzeWithClaude } from './claude-client';
import { splitIntoChunks } from './text-processing';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, projectId } = await req.json() as AnalyzeRequest;
    
    if (!filePath || !projectId) {
      throw new Error('No file path or project ID provided');
    }

    console.log('Processing file:', filePath);
    console.log('Project ID:', projectId);
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const projectInfo = await getProjectInfo(supabaseAdmin, projectId);
    const knowledgeEntries = await getKnowledgeBaseEntries(supabaseAdmin);
    console.log('Retrieved knowledge base entries:', knowledgeEntries.length);

    const text = await downloadRFPFile(supabaseAdmin, filePath);
    console.log('File content length:', text.length);

    const chunks = splitIntoChunks(text);
    console.log(`Split document into ${chunks.length} chunks`);

    const prompt = generateAnalysisPrompt(projectInfo, knowledgeEntries);

    const chunkAnalyses = await Promise.all(
      chunks.map(chunk => analyzeWithClaude(prompt, chunk, anthropicApiKey))
    );

    const combinedAnalysis = await analyzeWithClaude(
      prompt,
      `Combine and summarize these section analyses into a cohesive summary:\n\n${chunkAnalyses.join('\n\n')}`,
      anthropicApiKey
    );

    const response: ApiResponse = { analysis: combinedAnalysis };
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rfp function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const apiError: ApiError = { 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    };
    return new Response(
      JSON.stringify(apiError),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});