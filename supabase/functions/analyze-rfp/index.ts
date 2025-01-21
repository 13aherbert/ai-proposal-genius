import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { splitIntoChunks } from './text-processing.ts';
import { generateAnalysisPrompt } from './prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, projectId } = await req.json();
    console.log('Processing request for:', { filePath, projectId });

    if (!filePath || !projectId) {
      throw new Error('Missing required fields: filePath and projectId are required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Get knowledge entries for context
    const { data: knowledgeEntries, error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .select('category, title')
      .limit(10); // Limit to recent entries to manage token count

    if (knowledgeError) {
      console.error('Error fetching knowledge entries:', knowledgeError);
      throw new Error('Failed to fetch knowledge entries');
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
    const chunks = splitIntoChunks(text);
    console.log(`Split text into ${chunks.length} chunks`);

    // Process each chunk with OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = generateAnalysisPrompt(projectData, knowledgeEntries);
    let combinedAnalysis = '';

    for (const [index, chunk] of chunks.entries()) {
      console.log(`Processing chunk ${index + 1} of ${chunks.length}`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: `Analyze this section (${index + 1}/${chunks.length}) of the RFP:\n\n${chunk}`
            }
          ],
          max_tokens: 1000, // Reduced to ensure we stay within limits
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`OpenAI API error for chunk ${index + 1}:`, error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      combinedAnalysis += data.choices[0].message.content + '\n\n';
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
        error: error.message,
        details: error.stack
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