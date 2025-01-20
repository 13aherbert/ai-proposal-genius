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

async function getKnowledgeBaseEntries(supabaseAdmin: any) {
  const { data: entries, error } = await supabaseAdmin
    .from('knowledge_entries')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching knowledge base entries:', error);
    return [];
  }

  return entries;
}

async function analyzeChunk(chunk: string, openAIApiKey: string, projectInfo: any, knowledgeEntries: any[], retries = 3): Promise<string> {
  const knowledgeContext = knowledgeEntries.map(entry => 
    `${entry.category}: ${entry.title}`
  ).join('\n');

  const systemPrompt = `Act as an expert RFP analyst.

The company ${projectInfo.business_name || '[Business Name Not Specified]'} is reviewing an RFP from ${projectInfo.client_name || '[Client Name Not Specified]'} titled ${projectInfo.title}.

Here is relevant information from our Knowledge Base that you should reference:
${knowledgeContext}

Analyze the RFP document and provide a structured analysis with the following sections:

1. Key Requirements
- Extract and list all major requirements
- Highlight any technical specifications
- Note any mandatory certifications or qualifications

2. Timeline Analysis
- Submission deadline
- Project milestones
- Implementation schedule
- Review periods

3. Evaluation Criteria
- List all evaluation factors
- Note their relative weights if provided
- Highlight key scoring elements

4. Required Response Elements
- List all sections requiring specific responses
- Note any page limits or formatting requirements
- Identify required forms or attachments

5. Risk Assessment
- Identify potential red flags
- Note any ambiguous terms or specifications
- List missing information that needs clarification
- Highlight any challenging requirements

6. Team Assignment Recommendations
- Suggest team members or roles needed for each section
- Note areas where specific expertise is required
- Reference relevant knowledge base entries for each section

Format the analysis clearly with appropriate headers and bullet points. Prioritize actionable insights that will help the team respond effectively.`;

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
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`OpenAI API error (attempt ${attempt + 1}):`, errorData);
        
        if (response.status === 429 && attempt < retries - 1) {
          const waitTime = 2000 * (attempt + 1);
          console.log(`Rate limit hit, attempt ${attempt + 1}. Waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
          continue;
        }
        throw new Error(`OpenAI API error: ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
      if (attempt === retries - 1) throw error;
      const waitTime = 2000 * (attempt + 1);
      console.log(`Error occurred, waiting ${waitTime}ms before retry...`);
      await sleep(waitTime);
    }
  }
  throw new Error('Failed after all retry attempts');
}

function splitIntoChunks(text: string, maxChunkSize: number = 60000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  const paragraphs = text.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, projectId } = await req.json();
    
    if (!filePath || !projectId) {
      throw new Error('No file path or project ID provided');
    }

    console.log('Processing file:', filePath);
    console.log('Project ID:', projectId);
    
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
      console.error('Error fetching project:', projectError);
      throw new Error(`Error fetching project: ${projectError.message}`);
    }

    const knowledgeEntries = await getKnowledgeBaseEntries(supabaseAdmin);
    console.log('Retrieved knowledge base entries:', knowledgeEntries.length);

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
      chunks.map(chunk => analyzeChunk(chunk, openAIApiKey, projectData, knowledgeEntries))
    );

    const combinedAnalysis = await analyzeChunk(
      `Combine and summarize these section analyses into a cohesive summary:\n\n${chunkAnalyses.join('\n\n')}`,
      openAIApiKey,
      projectData,
      knowledgeEntries
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