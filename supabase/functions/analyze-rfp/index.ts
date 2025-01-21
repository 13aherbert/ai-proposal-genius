import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { splitIntoChunks } from './text-processing.ts';
import { generateAnalysisPrompt } from './prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callOpenAIWithRetry(messages: any[], retryCount = 0): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    console.log(`Attempt ${retryCount + 1}: Calling OpenAI API`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error (attempt ${retryCount + 1}):`, errorData);
      
      if (retryCount < MAX_RETRIES - 1) {
        const waitTime = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        return callOpenAIWithRetry(messages, retryCount + 1);
      }
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: The operation took too long to complete');
    }
    
    if (retryCount < MAX_RETRIES - 1) {
      const waitTime = RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Error occurred, retrying in ${waitTime}ms...`);
      await sleep(waitTime);
      return callOpenAIWithRetry(messages, retryCount + 1);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Request must be application/json');
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error.message 
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { filePath, projectId } = body;
    console.log('Processing request for:', { filePath, projectId });

    if (!filePath || !projectId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: 'filePath and projectId are required' 
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project info for context
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw new Error('Failed to fetch project information');
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('rfp-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error('Failed to download RFP file');
    }

    // Convert file to text
    const text = await fileData.text();
    console.log('File converted to text, length:', text.length);

    // Split text into manageable chunks
    const chunks = splitIntoChunks(text, 4000);
    console.log(`Split text into ${chunks.length} chunks`);

    // Process each chunk with OpenAI
    let combinedAnalysis = '';

    for (const [index, chunk] of chunks.entries()) {
      console.log(`Processing chunk ${index + 1} of ${chunks.length}`);
      
      const messages = [
        {
          role: 'system',
          content: generateAnalysisPrompt(projectData)
        },
        {
          role: 'user',
          content: `Analyze this section (${index + 1}/${chunks.length}) of the RFP:\n\n${chunk}`
        }
      ];

      const chunkAnalysis = await callOpenAIWithRetry(messages);
      combinedAnalysis += chunkAnalysis + '\n\n';
    }

    console.log('Analysis completed successfully');
    
    return new Response(
      JSON.stringify({ analysis: combinedAnalysis }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in analyze-rfp function:', error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message.includes('credit balance')) {
      errorMessage = "The AI service is currently unavailable due to credit limitations. Please try again later or contact support.";
      statusCode = 402;
    } else if (error.message.includes('rate limit')) {
      errorMessage = "The AI service is currently experiencing high demand. Please try again in a few minutes.";
      statusCode = 429;
    } else if (error.message.includes('timeout')) {
      errorMessage = "The request timed out. Please try again.";
      statusCode = 504;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.stack
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});