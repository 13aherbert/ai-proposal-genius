import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

export async function getProjectInfo(supabase: ReturnType<typeof createClient>, projectId: string) {
  console.log('Fetching project info for:', projectId);
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }

  console.log('Successfully fetched project info');
  return data;
}

export async function getKnowledgeBaseEntries(supabase: ReturnType<typeof createClient>) {
  console.log('Fetching knowledge base entries');
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*');

  if (error) {
    console.error('Error fetching knowledge entries:', error);
    throw error;
  }

  console.log('Successfully fetched knowledge entries');
  return data;
}

export async function downloadRFPFile(supabase: ReturnType<typeof createClient>, filePath: string): Promise<ArrayBuffer> {
  console.log('Starting download of RFP file:', filePath);
  
  try {
    const { data, error } = await supabase.storage
      .from('rfp-files')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download RFP file: ${error.message}`);
    }

    if (!data) {
      throw new Error('No file data received');
    }

    // Return the array buffer directly
    const arrayBuffer = await data.arrayBuffer();
    console.log('Successfully downloaded file, size:', arrayBuffer.byteLength);
    
    return arrayBuffer;
  } catch (error) {
    console.error('Error in downloadRFPFile:', error);
    throw new Error(`Failed to process RFP file: ${error.message}`);
  }
}