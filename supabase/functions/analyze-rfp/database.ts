import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { KnowledgeEntry, ProjectInfo } from './types.ts';

/**
 * Retrieves all knowledge base entries from the database
 */
export async function getKnowledgeBaseEntries(supabaseAdmin: any): Promise<KnowledgeEntry[]> {
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

/**
 * Retrieves project information from the database
 */
export async function getProjectInfo(supabaseAdmin: any, projectId: string): Promise<ProjectInfo> {
  const { data: projectData, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    throw new Error(`Error fetching project: ${projectError.message}`);
  }

  return projectData;
}

/**
 * Downloads and extracts text content from an RFP file
 */
export async function downloadRFPFile(supabaseAdmin: any, filePath: string): Promise<string> {
  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage
    .from('rfp-files')
    .download(filePath);

  if (downloadError) {
    console.error('Download error:', downloadError);
    throw new Error(`Error downloading file: ${downloadError.message}`);
  }

  return await fileData.text();
}