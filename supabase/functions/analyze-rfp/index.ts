import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    // Convert ArrayBuffer to Base64
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode.apply(null, uint8Array));
    
    // Use OpenAI's PDF understanding capabilities directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Please read this PDF document and extract all the text content from it. Return only the raw text content, no analysis yet.' 
              },
              {
                type: 'image',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                }
              }
            ],
          }
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;
    
    console.log('PDF text extraction completed successfully');
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log('Received request data:', requestData);

    if (!requestData.filePath || !requestData.projectId) {
      throw new Error('Missing required fields: filePath and projectId');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Downloading RFP file:', requestData.filePath);
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('rfp-files')
      .download(requestData.filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download RFP file: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received');
    }

    const arrayBuffer = await fileData.arrayBuffer();
    console.log('File downloaded successfully, size:', arrayBuffer.byteLength);

    const textContent = await extractTextFromPDF(arrayBuffer);
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    console.log('Text content extracted, length:', textContent.length);

    // Call OpenAI API for analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing RFP (Request for Proposal) documents. Analyze the following RFP text and provide a structured analysis with these sections:\n1. Key Requirements\n2. Timeline and Deadlines\n3. Evaluation Criteria\n4. Required Response Format\n5. Potential Risks\n\nFor each section, provide bullet points of the most important information.'
          },
          {
            role: 'user',
            content: textContent.substring(0, 15000) // Limit text length
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const analysisData = await response.json();
    const analysis = analysisData.choices[0].message.content;

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rfp function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to analyze RFP',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});