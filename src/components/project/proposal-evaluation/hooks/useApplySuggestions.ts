import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseEvaluation, getImprovementSummary } from "@/lib/evaluation-parser";

interface Section {
  section_id: string;
  section_title: string;
  content: string | null;
}

interface ImprovementProgress {
  isImproving: boolean;
  currentSection: string | null;
  completed: number;
  total: number;
  successes: string[];
  errors: string[];
}

interface UseApplySuggestionsProps {
  projectId: string;
  evaluation: string;
  onComplete?: () => void;
}

export function useApplySuggestions({ projectId, evaluation, onComplete }: UseApplySuggestionsProps) {
  const [progress, setProgress] = useState<ImprovementProgress>({
    isImproving: false,
    currentSection: null,
    completed: 0,
    total: 0,
    successes: [],
    errors: []
  });

  const parsedEvaluation = parseEvaluation(evaluation);
  const improvementSummary = getImprovementSummary(parsedEvaluation);

  const applySuggestions = async () => {
    setProgress({
      isImproving: true,
      currentSection: 'Fetching sections...',
      completed: 0,
      total: 0,
      successes: [],
      errors: []
    });

    try {
      // Fetch current proposal sections
      const { data: sections, error: sectionsError } = await supabase
        .from('proposal_sections')
        .select('section_id, section_title, content')
        .eq('project_id', projectId);

      if (sectionsError) throw sectionsError;
      
      if (!sections || sections.length === 0) {
        throw new Error('No proposal sections found');
      }

      // Filter to sections with content
      const sectionsWithContent = sections.filter(s => s.content && s.content.trim().length > 0);
      
      if (sectionsWithContent.length === 0) {
        throw new Error('No sections with content to improve');
      }

      setProgress(prev => ({
        ...prev,
        total: sectionsWithContent.length,
        currentSection: 'Preparing improvements...'
      }));

      // Fetch RFP analysis
      const { data: project } = await supabase
        .from('projects')
        .select('analysis')
        .eq('project_id', projectId)
        .single();

      toast.loading('Applying evaluation suggestions...', { id: 'apply-suggestions' });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('apply-evaluation-suggestions', {
        body: {
          projectId,
          evaluation,
          sections: sectionsWithContent,
          analysis: project?.analysis || ''
        }
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        improvements: Array<{ section_title: string }>;
        errors: string[];
        summary: { improved: number; failed: number };
      };

      setProgress({
        isImproving: false,
        currentSection: null,
        completed: result.summary.improved,
        total: sectionsWithContent.length,
        successes: result.improvements.map(i => i.section_title),
        errors: result.errors
      });

      toast.dismiss('apply-suggestions');
      
      if (result.success) {
        toast.success('Suggestions applied successfully', {
          description: `Improved ${result.summary.improved} sections`
        });
      } else if (result.summary.improved > 0) {
        toast.warning('Partially applied suggestions', {
          description: `Improved ${result.summary.improved} sections, ${result.summary.failed} failed`
        });
      } else {
        toast.error('Failed to apply suggestions', {
          description: result.errors[0] || 'Unknown error occurred'
        });
      }

      onComplete?.();
    } catch (error) {
      console.error('Error applying suggestions:', error);
      setProgress(prev => ({
        ...prev,
        isImproving: false,
        currentSection: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }));
      
      toast.dismiss('apply-suggestions');
      toast.error('Failed to apply suggestions', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    }
  };

  return {
    progress,
    parsedEvaluation,
    improvementSummary,
    applySuggestions
  };
}
