import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeChunk(chunk: string, openAIApiKey: string, projectInfo: any, retries = 3): Promise<string> {
  const systemPrompt = `Act as an expert proposal writer.

The company ${projectInfo.business_name || '[Business Name Not Specified]'} is submitting a proposal to ${projectInfo.client_name || '[Client Name Not Specified]'} to a solicitation titled ${projectInfo.title}.

The solicitation includes a Statement of Work (SOW) that describes the work to be performed. The SOW and the proposal instructions are in the RFP document.

Review the attached Request for Proposal's SOW and the instructions and create a detailed outline for the proposal. Ensure the outline covers all the items specified in the instructions. Be sure to follow the proposal instructions exactly. For the individual section headings, use the same words used in the proposal instructions.`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: chunk
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        if (response.status === 429 && attempt < retries - 1) {
          console.log(`Rate limit hit, attempt ${attempt + 1}. Waiting before retry...`);
          await sleep(2000); // Wait 2 seconds before retrying
          continue;
        }
        throw new Error(`OpenAI API error: ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.log(`Error on attempt ${attempt + 1}, retrying...`, error);
      await sleep(2000);
    }
  }
  throw new Error('Failed after all retry attempts');
}

// Function to split text into chunks of roughly equal size
function splitIntoChunks(text: string, maxChunkSize: number = 60000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs to maintain context
  const paragraphs = text.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If a single paragraph is too long, split it further
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
              currentChunk = '';
            }
          }
          currentChunk += sentence + '. ';
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, projectId } = await req.json();
    
    if (!filePath || !projectId) {
      throw new Error('No file path or project ID provided');
    }

    console.log('Processing file:', filePath);
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Error fetching project: ${projectError.message}`);
    }

    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('rfp-files')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Error downloading file: ${downloadError.message}`);
    }

    const text = await fileData.text();
    console.log('File content length:', text.length);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const chunks = splitIntoChunks(text);
    console.log(`Split document into ${chunks.length} chunks`);

    const chunkAnalyses = await Promise.all(
      chunks.map(chunk => analyzeChunk(chunk, openAIApiKey, projectData))
    );

    const combinedAnalysis = await analyzeChunk(
      `Combine and summarize these section analyses into a cohesive summary:\n\n${chunkAnalyses.join('\n\n')}`,
      openAIApiKey,
      projectData
    );

    return new Response(
      JSON.stringify({ analysis: combinedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rfp function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
