import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "./config.ts";
import { AnalyzeRequest, ApiResponse, ApiError } from "./types.ts";
import { getKnowledgeBaseEntries, getProjectInfo, downloadRFPFile } from "./database.ts";
import { splitIntoChunks } from "./text-processing.ts";
import { generateAnalysisPrompt } from "./prompts.ts";
import { analyzeWithOpenAI } from "./openai-client.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Parse and validate request body
    const requestData: AnalyzeRequest = await req.json();
    if (!requestData.filePath || !requestData.projectId) {
      throw new Error('Invalid request body: missing required fields');
    }

    console.log('Starting analysis for project:', requestData.projectId);

    // Get project information and knowledge base entries
    const [projectInfo, knowledgeEntries] = await Promise.all([
      getProjectInfo(supabaseAdmin, requestData.projectId),
      getKnowledgeBaseEntries(supabaseAdmin)
    ]);

    // Download and process the RFP file
    const fileContent = await downloadRFPFile(supabaseAdmin, requestData.filePath);
    const chunks = splitIntoChunks(fileContent);
    
    console.log(`Processing ${chunks.length} chunks of content`);

    // Generate the analysis prompt
    const prompt = generateAnalysisPrompt(projectInfo, knowledgeEntries);

    // Analyze the content
    const analysis = await analyzeWithOpenAI(prompt, chunks[0], openaiApiKey);

    const response: ApiResponse = { analysis };
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rfp function:', error);
    
    const errorResponse: ApiError = {
      error: 'Failed to analyze RFP',
      details: error.message
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});