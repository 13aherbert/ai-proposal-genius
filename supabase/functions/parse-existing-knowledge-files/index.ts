
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
    console.log('Starting batch parsing of existing knowledge files');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all entries with files that haven't been parsed yet
    const { data: entries, error: fetchError } = await supabase
      .from('knowledge_entries')
      .select('*')
      .is('parsed_content', null)
      .not('file_path', 'is', null);

    if (fetchError) {
      console.error('Error fetching entries:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${entries?.length || 0} entries to parse`);

    const results = [];
    for (const entry of entries || []) {
      try {
        console.log(`Processing entry ${entry.id} with file ${entry.file_path}`);
        
        // Download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('knowledge-files')
          .download(entry.file_path);

        if (downloadError) {
          console.error(`Error downloading file for entry ${entry.id}:`, downloadError);
          results.push({ id: entry.id, status: 'error', error: downloadError.message });
          continue;
        }

        // Parse content based on file type
        let parsedContent = '';
        if (fileData instanceof Blob) {
          if (fileData.type.includes('text/')) {
            parsedContent = await fileData.text();
          } else if (fileData.type === 'application/pdf') {
            parsedContent = 'PDF content parsing will be implemented';
          } else if (fileData.type.includes('application/vnd.openxmlformats-officedocument') ||
                     fileData.type.includes('application/msword')) {
            parsedContent = 'Document content parsing will be implemented';
          }
        }

        // Update the entry with parsed content
        const { error: updateError } = await supabase
          .from('knowledge_entries')
          .update({ parsed_content: parsedContent })
          .eq('id', entry.id);

        if (updateError) {
          console.error(`Error updating entry ${entry.id}:`, updateError);
          results.push({ id: entry.id, status: 'error', error: updateError.message });
        } else {
          results.push({ id: entry.id, status: 'success' });
        }
      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error);
        results.push({ id: entry.id, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Batch parsing completed', 
        results,
        totalProcessed: entries?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in parse-existing-knowledge-files function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
