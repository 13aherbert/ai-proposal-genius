import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from './config.ts';
import { AnalyzeRequest, ApiResponse, ApiError } from './types.ts';
import { getKnowledgeBaseEntries, getProjectInfo, downloadRFPFile } from './database.ts';
import { generateAnalysisPrompt } from './prompts.ts';
import { analyzeWithOpenAI } from './openai-client.ts';
import { splitIntoChunks } from './text-processing.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request body
    let body;
    try {
      const text = await req.text();
      console.log('Received request body:', text);
      body = JSON.parse(text);
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid JSON in request body');
    }

    const { filePath, projectId } = body as AnalyzeRequest;
    
    if (!filePath || !projectId) {
      throw new Error('Missing required fields: filePath and projectId are required');
    }

    console.log('Processing file:', filePath);
    console.log('Project ID:', projectId);
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const projectInfo = await getProjectInfo(supabaseAdmin, projectId);
    const knowledgeEntries = await getKnowledgeBaseEntries(supabaseAdmin);
    console.log('Retrieved knowledge base entries:', knowledgeEntries.length);

    const text = await downloadRFPFile(supabaseAdmin, filePath);
    console.log('File content length:', text.length);

    const chunks = splitIntoChunks(text);
    console.log(`Split document into ${chunks.length} chunks`);

    const prompt = generateAnalysisPrompt(projectInfo, knowledgeEntries);

    // Process chunks sequentially instead of in parallel
    const chunkAnalyses = [];
    for (const chunk of chunks) {
      console.log('Processing chunk of length:', chunk.length);
      const analysis = await analyzeWithOpenAI(prompt, chunk, openaiApiKey);
      chunkAnalyses.push(analysis);
      // Add a delay between chunks to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Final analysis with reduced content
    const summaryPrompt = `Combine and summarize these section analyses into a concise summary:\n\n${chunkAnalyses.join('\n\n')}`;
    const combinedAnalysis = await analyzeWithOpenAI(
      prompt,
      summaryPrompt,
      openaiApiKey
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