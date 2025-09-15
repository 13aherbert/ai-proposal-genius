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
    console.log('Starting batch parsing of existing knowledge files...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find all entries with files but no parsed content or failed status
    const { data: entries, error: fetchError } = await supabase
      .from('knowledge_entries')
      .select('entry_id, file_path, parsing_status')
      .not('file_path', 'is', null)
      .or('parsed_content.is.null,parsing_status.eq.failed,parsing_status.eq.pending');

    if (fetchError) {
      console.error('Error fetching entries:', fetchError);
      throw fetchError;
    }

    if (!entries || entries.length === 0) {
      console.log('No entries found that need parsing');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No entries found that need parsing',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${entries.length} entries that need parsing`);

    let processed = 0;
    let failed = 0;

    // Process entries in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (entry) => {
        try {
          console.log(`Processing entry ${entry.entry_id}`);
          
          // Call the enhanced document parser for each entry
          const { error: parseError } = await supabase.functions.invoke(
            'enhanced-document-parser',
            {
              body: {
                entryId: entry.entry_id,
                filePath: entry.file_path
              }
            }
          );

          if (parseError) {
            console.error(`Failed to parse entry ${entry.entry_id}:`, parseError);
            failed++;
          } else {
            console.log(`Successfully initiated parsing for entry ${entry.entry_id}`);
            processed++;
          }
        } catch (error) {
          console.error(`Error processing entry ${entry.entry_id}:`, error);
          failed++;
        }
      });

      // Wait for the current batch to complete before moving to the next
      await Promise.allSettled(batchPromises);
      
      // Add a small delay between batches
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Batch processing completed. Processed: ${processed}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Batch parsing initiated',
        totalEntries: entries.length,
        processed,
        failed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-parse-knowledge-files function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});