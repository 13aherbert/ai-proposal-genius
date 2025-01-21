import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import * as pdfjsLib from "https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.min.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure PDF.js worker
const pdfjsWorker = await import("https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.worker.min.js");
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

serve(async (req) => {
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

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('rfp-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error('Failed to download RFP file');
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    try {
      // Load the PDF document
      console.log('Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      console.log('PDF document loaded, pages:', pdfDocument.numPages);

      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        console.log(`Processing page ${i}/${pdfDocument.numPages}`);
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      console.log('Text extraction complete, length:', fullText.length);

      // Call OpenAI API for analysis
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      console.log('Calling OpenAI API...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing RFP (Request for Proposal) documents. Analyze the following RFP text and provide a concise summary including key requirements, deadlines, and important considerations. Focus on extracting the most critical information that would be relevant for preparing a response.'
            },
            {
              role: 'user',
              content: fullText.slice(0, 8000) // Limit text length to avoid token limits
            }
          ],
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      console.log('OpenAI API response received');
      
      const analysis = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ analysis }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (pdfError) {
      console.error('Error processing PDF:', pdfError);
      throw new Error(`Failed to process PDF: ${pdfError.message}`);
    }
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