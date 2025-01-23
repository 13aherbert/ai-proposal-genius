import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entryId, filePath } = await req.json();
    console.log('Parsing file for entry:', entryId, 'at path:', filePath);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw downloadError;
    }

    // Convert file to text based on type
    let parsedContent = '';
    if (fileData instanceof Blob) {
      if (fileData.type.includes('text/')) {
        parsedContent = await fileData.text();
      } else if (fileData.type === 'application/pdf') {
        // For PDF files, we could use a PDF parsing library
        // For now, we'll just store a placeholder
        parsedContent = 'PDF content parsing will be implemented';
      } else if (fileData.type.includes('application/vnd.openxmlformats-officedocument') ||
                 fileData.type.includes('application/msword')) {
        // For Word documents, we could use a document parsing library
        // For now, we'll just store a placeholder
        parsedContent = 'Document content parsing will be implemented';
      }
    }

    // Update the knowledge entry with parsed content
    const { error: updateError } = await supabase
      .from('knowledge_entries')
      .update({ parsed_content: parsedContent })
      .eq('id', entryId);

    if (updateError) {
      console.error('Error updating entry with parsed content:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'File parsed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-knowledge-file function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});