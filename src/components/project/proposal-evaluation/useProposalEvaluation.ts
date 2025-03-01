
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  evaluation: string | null;
  analysis: string | null;
}

interface ProposalSection {
  section_title: string;
  content: string | null;
}

export function useProposalEvaluation(projectId: string) {
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved evaluation when component mounts
  useEffect(() => {
    if (!projectId) return;
    
    const loadEvaluation = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('projects')
          .select<string, Project>('evaluation')
          .eq('project_id', projectId)
          .maybeSingle();

        if (error) throw error;
        if (data?.evaluation) {
          setEvaluation(data.evaluation);
        }
      } catch (error) {
        console.error('Error loading evaluation:', error);
        toast.error("Failed to load saved evaluation", {
          description: "We couldn't retrieve your saved evaluation. Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvaluation();
  }, [projectId]);

  const handleEvaluate = async () => {
    if (!projectId) {
      toast.error("Invalid project", {
        description: "Cannot find project to evaluate."
      });
      return;
    }
    
    setIsEvaluating(true);
    setError(null);
    setProgress(0);
    toast.loading("Evaluating your proposal...");

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
        .select<string, ProposalSection>('section_title, content')
        .eq('project_id', projectId);

      if (sectionsError) throw sectionsError;
      
      if (!sections || sections.length === 0) {
        throw new Error("No proposal sections found to evaluate");
      }

      // Get the project details including RFP analysis
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select<string, Project>('analysis')
        .eq('project_id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      
      if (!project?.analysis) {
        throw new Error("RFP analysis not found. Please analyze your RFP first.");
      }

      console.log('Calling evaluation function with sections:', sections?.length);
      
      const { data, error: evaluationError } = await supabase.functions.invoke<{ evaluation: string }>('evaluate-proposal', {
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
      
      toast.dismiss();
      toast.success('Proposal evaluated successfully', {
        description: 'Your proposal has been analyzed and feedback is ready to review.'
      });
    } catch (error) {
      console.error('Error evaluating proposal:', error);
      setError('Failed to evaluate proposal. Please try again.');
      
      toast.dismiss();
      toast.error('Failed to evaluate proposal', {
        description: error instanceof Error ? error.message : "Please ensure you have added content to your proposal sections."
      });
      setProgress(0);
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    evaluation,
    isEvaluating,
    isLoading,
    error,
    progress,
    handleEvaluate
  };
}
