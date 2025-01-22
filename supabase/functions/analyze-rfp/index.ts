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
  console.log('Request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the raw request body
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    // Validate request body
    if (!rawBody) {
      throw new Error('Request body is empty');
    }

    // Parse request data
    let requestData: AnalyzeRequest;
    try {
      requestData = JSON.parse(rawBody);
      console.log('Parsed request data:', requestData);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }

    // Validate required fields
    if (!requestData.filePath || !requestData.projectId) {
      throw new Error('Missing required fields: filePath and projectId are required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get project information and knowledge base entries
    console.log('Fetching project info and knowledge entries...');
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
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
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
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});