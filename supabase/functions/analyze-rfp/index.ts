
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import pdfParse from "npm:pdf-parse@1.1.1";
import mammoth from "npm:mammoth@1.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getFileType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  return extension;
}

async function extractTextFromFile(arrayBuffer: ArrayBuffer, filePath: string): Promise<string> {
  const fileType = getFileType(filePath);
  console.log('Extracting text from file type:', fileType);

  try {
    switch (fileType) {
      case 'pdf':
        console.log('Starting PDF text extraction');
        const uint8Array = new Uint8Array(arrayBuffer);
        const data = await pdfParse(uint8Array);
        console.log('PDF text extraction completed, text length:', data.text.length);
        return data.text;
      
      case 'txt':
      case 'text':
        console.log('Processing text file');
        const textDecoder = new TextDecoder('utf-8');
        const text = textDecoder.decode(arrayBuffer);
        console.log('Text file processed, length:', text.length);
        return text;
      
      case 'doc':
      case 'docx':
        console.log('Processing Word document with Mammoth.js');
        try {
          const buffer = Buffer.from(arrayBuffer);
          const result = await mammoth.extractRawText({ buffer });
          
          if (result.text && result.text.trim().length > 0) {
            console.log('Word document text extraction completed, length:', result.text.length);
            
            // Log any warnings from mammoth
            if (result.messages && result.messages.length > 0) {
              console.log('Mammoth warnings:', result.messages.map(m => m.message).join(', '));
            }
            
            return result.text;
          } else {
            throw new Error('No text content found in Word document');
          }
        } catch (mammothError) {
          console.error('Mammoth.js extraction failed:', mammothError);
          // Fallback: try to decode as text if mammoth fails
          console.log('Attempting fallback text extraction for Word document');
          const fallbackDecoder = new TextDecoder('utf-8');
          const fallbackText = fallbackDecoder.decode(arrayBuffer);
          
          if (fallbackText && fallbackText.trim().length > 50) {
            console.log('Fallback extraction successful');
            return fallbackText;
          }
          
          throw new Error(`Failed to extract text from Word document: ${mammothError.message}`);
        }
      
      case 'rtf':
        console.log('Processing RTF document');
        const rtfDecoder = new TextDecoder('utf-8');
        const rtfText = rtfDecoder.decode(arrayBuffer);
        // Basic RTF processing - remove RTF control codes
        const cleanText = rtfText
          .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
          .replace(/[{}]/g, '') // Remove braces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        console.log('RTF processing completed, length:', cleanText.length);
        return cleanText;
      
      default:
        // Try to decode as text for unknown file types
        console.log('Unknown file type, attempting text extraction');
        try {
          const decoder = new TextDecoder('utf-8');
          const extractedText = decoder.decode(arrayBuffer);
          if (extractedText && extractedText.trim().length > 0) {
            console.log('Text extraction successful for unknown file type');
            return extractedText;
          }
        } catch (decodeError) {
          console.error('Failed to decode as text:', decodeError);
        }
        
        throw new Error(`Unsupported file type: ${fileType}. Supported formats: PDF, TXT, DOC, DOCX, RTF`);
    }
  } catch (error) {
    console.error('Error in file text extraction:', error);
    throw new Error(`Failed to extract text from ${fileType.toUpperCase()}: ${error.message}`);
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
    const extractedText = await extractTextFromFile(arrayBuffer, requestData.filePath);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content extracted from file');
    }

    console.log('Text extracted successfully, length:', extractedText.length);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Call OpenAI API for analysis
    console.log('Calling OpenAI API for analysis');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      .eq('project_id', requestData.projectId);

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
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
