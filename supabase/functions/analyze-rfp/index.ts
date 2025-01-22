import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction');
    const uint8Array = new Uint8Array(arrayBuffer);
    const data = await pdfParse(uint8Array);
    console.log('PDF text extraction completed, text length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const requestData = await req.json();
    console.log('Received request data:', requestData);

    if (!requestData.filePath || !requestData.projectId) {
      throw new Error('Missing required fields: filePath and projectId');
    }

    // Download file from storage
    console.log('Downloading file:', requestData.filePath);
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('rfp-files')
      .download(requestData.filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to ArrayBuffer and extract text
    const arrayBuffer = await fileData.arrayBuffer();
    const extractedText = await extractTextFromPDF(arrayBuffer);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    console.log('Text extracted successfully, length:', extractedText.length);

    // Call OpenAI API for analysis
    console.log('Calling OpenAI API for analysis');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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
            content: extractedText.substring(0, 15000)
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const analysisData = await response.json();
    const analysis = analysisData.choices[0].message.content;

    // Save analysis to database
    console.log('Saving analysis to database');
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ analysis })
      .eq('id', requestData.projectId);

    if (updateError) {
      console.error('Error saving analysis:', updateError);
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log('Analysis completed and saved successfully');

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