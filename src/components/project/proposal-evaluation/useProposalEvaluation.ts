
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProposalEvaluation(projectId: string) {
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Load saved evaluation when component mounts
  useEffect(() => {
    if (!projectId) return;
    
    const loadEvaluation = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('evaluation')
          .eq('project_id', projectId)
          .maybeSingle();

        if (error) throw error;
        if (data?.evaluation) {
          setEvaluation(data.evaluation);
        }
      } catch (error) {
        console.error('Error loading evaluation:', error);
        toast.error("Failed to load saved evaluation");
      }
    };

    loadEvaluation();
  }, [projectId]);

  const handleEvaluate = async () => {
    if (!projectId) return;
    
    setIsEvaluating(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates during evaluation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = Math.round(prev + Math.random() * 15);
          return next > 90 ? 90 : next;
        });
      }, 1000);

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
        .eq('project_id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;

      console.log('Calling evaluation function with sections:', sections?.length);
      
      const { data, error: evaluationError } = await supabase.functions.invoke('evaluate-proposal', {
        body: { 
          projectId,
          sections,
          analysis: project?.analysis
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (evaluationError) throw evaluationError;

      // Save the evaluation to the database
      const { error: saveError } = await supabase
        .from('projects')
        .update({ evaluation: data.evaluation })
        .eq('project_id', projectId);

      if (saveError) throw saveError;

      setEvaluation(data.evaluation);
      toast.success('Proposal evaluated and saved successfully');
    } catch (error) {
      console.error('Error evaluating proposal:', error);
      setError('Failed to evaluate proposal. Please try again.');
      toast.error('Failed to evaluate proposal');
      setProgress(0);
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    evaluation,
    isEvaluating,
    error,
    progress,
    handleEvaluate
  };
}
