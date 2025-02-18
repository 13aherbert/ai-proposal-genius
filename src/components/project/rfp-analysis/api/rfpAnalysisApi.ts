
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResponse {
  analysis: string | null;
}

interface ProjectUpdate {
  analysis: string | null;
}

/**
 * Loads the saved analysis for a project from the database
 * @param projectId - The ID of the project to load the analysis for
 * @returns The saved analysis text or null if none exists
 */
export async function loadSavedAnalysis(projectId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('analysis')
    .eq('project_id', projectId)
    .single();

  if (error) throw error;
  return data?.analysis || null;
}

/**
 * Clears the analysis for a project in the database
 * @param projectId - The ID of the project to clear the analysis for
 */
export async function clearAnalysis(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ analysis: null } as ProjectUpdate)
    .eq('project_id', projectId);

  if (error) throw error;
}

/**
 * Invokes the RFP analysis function and saves the result
 * @param filePath - Path to the RFP file to analyze
 * @param projectId - ID of the project
 * @returns The analysis result
 */
export async function analyzeRFP(filePath: string, projectId: string): Promise<string> {
  const { data, error: functionError } = await supabase.functions.invoke<AnalysisResponse>('analyze-rfp', {
    body: { filePath, projectId }
  });

  if (functionError) throw new Error(functionError.message || 'Error calling analysis service');
  if (!data?.analysis) throw new Error("Invalid response from analysis service");

  // Save the analysis result
  const { error: updateError } = await supabase
    .from('projects')
    .update({ analysis: data.analysis } as ProjectUpdate)
    .eq('project_id', projectId);

  if (updateError) throw new Error('Failed to save analysis');

  return data.analysis;
}
