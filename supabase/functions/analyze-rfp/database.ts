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

export async function downloadRFPFile(supabase: ReturnType<typeof createClient>, filePath: string): Promise<string> {
  console.log('Downloading RFP file:', filePath);
  
  try {
    const { data, error } = await supabase.storage
      .from('rfp-files')
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No file data received');
    }

    // Convert blob to text
    const text = await data.text();
    console.log('Successfully downloaded and converted file to text');
    return text;
  } catch (error) {
    console.error('Error in downloadRFPFile:', error);
    throw new Error(`Failed to download RFP file: ${error.message}`);
  }
}