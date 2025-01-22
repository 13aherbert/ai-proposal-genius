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
    console.log('Starting analysis process...');
    
    // Validate request content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      throw new Error('Content-Type must be application/json');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // Parse and validate request body
    let requestData: AnalyzeRequest;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      
      if (!text) {
        throw new Error('Request body is empty');
      }
      
      requestData = JSON.parse(text);
      console.log('Parsed request data:', JSON.stringify(requestData));
      
      if (!requestData.filePath || !requestData.projectId) {
        throw new Error('Missing required fields: filePath and projectId are required');
      }
    } catch (error) {
      console.error('Error parsing request:', error);
      throw new Error(`Invalid request body: ${error.message}`);
    }

    try {
      // Get project information and knowledge base entries
      const [projectInfo, knowledgeEntries] = await Promise.all([
        getProjectInfo(supabaseAdmin, requestData.projectId),
        getKnowledgeBaseEntries(supabaseAdmin)
      ]);

      console.log('Successfully fetched project info and knowledge entries');

      // Download and process the RFP file
      console.log('Downloading RFP file:', requestData.filePath);
      const fileContent = await downloadRFPFile(supabaseAdmin, requestData.filePath);
      
      if (!fileContent) {
        throw new Error('Failed to download RFP file or file is empty');
      }
      
      console.log('Successfully downloaded file, content length:', fileContent.length);

      const chunks = splitIntoChunks(fileContent);
      console.log(`Processing ${chunks.length} chunks of content`);

      // Generate the analysis prompt
      const prompt = generateAnalysisPrompt(projectInfo, knowledgeEntries);
      console.log('Generated analysis prompt');

      // Analyze the content
      console.log('Starting OpenAI analysis...');
      const analysis = await analyzeWithOpenAI(prompt, chunks[0], openaiApiKey);
      console.log('Successfully completed OpenAI analysis');

      const response: ApiResponse = { analysis };
      
      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Detailed error in analysis process:', error);
      throw error;
    }

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