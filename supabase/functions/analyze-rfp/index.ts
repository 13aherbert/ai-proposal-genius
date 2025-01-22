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
    console.error('OpenAI API key is not configured');
    throw new Error('OpenAI API key is not configured');
  }
  
  try {
    console.log(`Attempt ${retryCount + 1}: Calling OpenAI API`);
    
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
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error (attempt ${retryCount + 1}):`, errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI API');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error in OpenAI API call (attempt ${retryCount + 1}):`, error);
    
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
    console.log('Starting RFP analysis request');
    
    // Validate request content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      return new Response(
        JSON.stringify({ error: 'Request must be application/json' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { filePath, projectId } = body;
    
    if (!filePath || !projectId) {
      console.error('Missing required fields:', { filePath, projectId });
      return new Response(
        JSON.stringify({ error: 'filePath and projectId are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing request for:', { filePath, projectId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing');
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project info
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw new Error('Failed to fetch project information');
    }

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('rfp-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error('Failed to download RFP file');
    }

    const text = await fileData.text();
    console.log('File converted to text, length:', text.length);

    // Process text
    const chunks = splitIntoChunks(text, 4000);
    console.log(`Split text into ${chunks.length} chunks`);

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
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
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