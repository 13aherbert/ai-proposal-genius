import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProposalEvaluation(projectId: string) {
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    setError(null);

    try {
      console.log('Starting proposal evaluation for project:', projectId);
      
      // First, fetch all proposal sections
      const { data: sections, error: sectionsError } = await supabase
        .from('proposal_sections')
        .select('section_title, content')
        .eq('project_id', projectId);

      if (sectionsError) throw sectionsError;

      // Get the project details including RFP analysis
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('analysis')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      console.log('Calling evaluation function with sections:', sections.length);
      
      const { data, error: evaluationError } = await supabase.functions.invoke('evaluate-proposal', {
        body: { 
          projectId,
          sections,
          analysis: project.analysis
        }
      });

      if (evaluationError) throw evaluationError;

      setEvaluation(data.evaluation);
      toast.success('Proposal evaluated successfully');
    } catch (error) {
      console.error('Error evaluating proposal:', error);
      setError('Failed to evaluate proposal. Please try again.');
      toast.error('Failed to evaluate proposal');
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    evaluation,
    isEvaluating,
    error,
    handleEvaluate
  };
}