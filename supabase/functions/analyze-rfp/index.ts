import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm';
import { corsHeaders } from "./config.ts";
import { AnalyzeRequest, ApiResponse, ApiError } from "./types.ts";
import { getKnowledgeBaseEntries, getProjectInfo, downloadRFPFile } from "./database.ts";
import { splitIntoChunks } from "./text-processing.ts";
import { generateAnalysisPrompt } from "./prompts.ts";
import { analyzeWithOpenAI } from "./openai-client.ts";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText;
}

serve(async (req) => {
  console.log('Request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    if (!rawBody) {
      throw new Error('Request body is empty');
    }

    let requestData: AnalyzeRequest;
    try {
      requestData = JSON.parse(rawBody);
      console.log('Parsed request data:', requestData);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }

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

    console.log('Fetching project info and knowledge entries...');
    const [projectInfo, knowledgeEntries] = await Promise.all([
      getProjectInfo(supabaseAdmin, requestData.projectId),
      getKnowledgeBaseEntries(supabaseAdmin)
    ]);

    console.log('Successfully fetched project info and knowledge entries');

    console.log('Downloading RFP file:', requestData.filePath);
    const fileBuffer = await downloadRFPFile(supabaseAdmin, requestData.filePath);
    
    if (!fileBuffer) {
      throw new Error('Failed to download RFP file or file is empty');
    }
    
    console.log('Successfully downloaded file, extracting text content...');
    const textContent = await extractTextFromPDF(fileBuffer);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('Failed to extract text from PDF');
    }
    
    console.log('Successfully extracted text, content length:', textContent.length);

    const chunks = splitIntoChunks(textContent);
    console.log(`Processing ${chunks.length} chunks of content`);

    const prompt = generateAnalysisPrompt(projectInfo, knowledgeEntries);
    console.log('Generated analysis prompt');

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