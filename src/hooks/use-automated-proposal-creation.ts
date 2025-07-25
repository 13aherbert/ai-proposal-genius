import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { analyzeRFP } from '@/components/project/rfp-analysis/api/rfpAnalysisApi';
import { useAuth } from '@/components/AuthProvider';

export type AutomationStep = 
  | 'analysis' 
  | 'outline' 
  | 'sections' 
  | 'content' 
  | 'evaluation' 
  | 'completed';

export interface AutomationProgress {
  currentStep: AutomationStep;
  stepProgress: number;
  overallProgress: number;
  isRunning: boolean;
  isPaused: boolean;
  completedSteps: AutomationStep[];
  errors: Array<{ step: AutomationStep; message: string; }>;
  startTime?: Date;
  estimatedTimeRemaining?: number;
}

interface StepResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function useAutomatedProposalCreation(projectId: string, filePath: string) {
  const { session } = useAuth();
  const [progress, setProgress] = useState<AutomationProgress>({
    currentStep: 'analysis',
    stepProgress: 0,
    overallProgress: 0,
    isRunning: false,
    isPaused: false,
    completedSteps: [],
    errors: []
  });

  const updateProgress = useCallback((updates: Partial<AutomationProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const calculateOverallProgress = useCallback((step: AutomationStep, stepProgress: number) => {
    const stepWeights = {
      analysis: 20,
      outline: 20,
      sections: 15,
      content: 35,
      evaluation: 10
    };

    const stepOrder: AutomationStep[] = ['analysis', 'outline', 'sections', 'content', 'evaluation'];
    const currentStepIndex = stepOrder.indexOf(step);
    
    let totalProgress = 0;
    
    // Add completed steps
    for (let i = 0; i < currentStepIndex; i++) {
      totalProgress += stepWeights[stepOrder[i]];
    }
    
    // Add current step progress
    totalProgress += (stepWeights[step] * stepProgress) / 100;
    
    return Math.round(totalProgress);
  }, []);

  // Step 1: RFP Analysis
  const executeAnalysisStep = useCallback(async (): Promise<StepResult> => {
    try {
      updateProgress({ 
        currentStep: 'analysis', 
        stepProgress: 0,
        overallProgress: calculateOverallProgress('analysis', 0)
      });

      // Check if analysis already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('analysis')
        .eq('project_id', projectId)
        .single();

      if (existingProject?.analysis?.trim()) {
        updateProgress({ 
          stepProgress: 100,
          overallProgress: calculateOverallProgress('analysis', 100)
        });
        return { success: true, data: existingProject.analysis };
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newStepProgress = Math.min(prev.stepProgress + 15, 90);
          return {
            ...prev,
            stepProgress: newStepProgress,
            overallProgress: calculateOverallProgress('analysis', newStepProgress)
          };
        });
      }, 2000);

      const analysisResult = await analyzeRFP(filePath, projectId);
      
      clearInterval(progressInterval);
      updateProgress({ 
        stepProgress: 100,
        overallProgress: calculateOverallProgress('analysis', 100)
      });

      return { success: true, data: analysisResult };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze RFP';
      return { success: false, error: errorMessage };
    }
  }, [projectId, filePath, updateProgress, calculateOverallProgress]);

  // Step 2: Proposal Outline Generation
  const executeOutlineStep = useCallback(async (analysis: string): Promise<StepResult> => {
    try {
      updateProgress({ 
        currentStep: 'outline', 
        stepProgress: 0,
        overallProgress: calculateOverallProgress('outline', 0)
      });

      // Check if outline already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('proposal_outline')
        .eq('project_id', projectId)
        .single();

      if (existingProject?.proposal_outline?.trim()) {
        updateProgress({ 
          stepProgress: 100,
          overallProgress: calculateOverallProgress('outline', 100)
        });
        return { success: true, data: existingProject.proposal_outline };
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newStepProgress = Math.min(prev.stepProgress + 20, 90);
          return {
            ...prev,
            stepProgress: newStepProgress,
            overallProgress: calculateOverallProgress('outline', newStepProgress)
          };
        });
      }, 1500);

      const { data: generatedData, error: functionError } = await supabase.functions.invoke<{ outline: string }>('generate-proposal-outline', {
        body: { projectId, analysis }
      });

      clearInterval(progressInterval);

      if (functionError) throw new Error(functionError.message);
      if (!generatedData?.outline) throw new Error("Invalid response from outline generation");

      // Save the outline
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          proposal_outline: generatedData.outline,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId);

      if (updateError) throw updateError;

      updateProgress({ 
        stepProgress: 100,
        overallProgress: calculateOverallProgress('outline', 100)
      });

      return { success: true, data: generatedData.outline };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate outline';
      return { success: false, error: errorMessage };
    }
  }, [projectId, updateProgress, calculateOverallProgress]);

  // Step 3: Create Sections from Outline
  const executeSectionsStep = useCallback(async (outline: string): Promise<StepResult> => {
    try {
      updateProgress({ 
        currentStep: 'sections', 
        stepProgress: 0,
        overallProgress: calculateOverallProgress('sections', 0)
      });

      // Extract section titles from outline (reuse existing logic)
      const extractSectionTitles = (outline: string): string[] => {
        const lines = outline.split('\n');
        const titles: string[] = [];
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Skip empty lines
          if (!trimmedLine) continue;
          
          // Skip "Proposal Outline Header" and "appendices" sections
          if (trimmedLine.toLowerCase().includes('proposal outline header') || 
              trimmedLine.toLowerCase().includes('appendices')) {
            continue;
          }
          
          // Match numbered sections (e.g., "1. Introduction", "2.1 Approach")
          const numberedMatch = trimmedLine.match(/^\d+(?:\.\d+)*\.\s*(.+)$/);
          if (numberedMatch) {
            titles.push(numberedMatch[1].trim());
            continue;
          }
          
          // Match lettered sections (e.g., "A. Introduction", "B.1 Approach") 
          const letteredMatch = trimmedLine.match(/^[A-Z](?:\.\d+)*\.\s*(.+)$/);
          if (letteredMatch) {
            titles.push(letteredMatch[1].trim());
            continue;
          }
          
          // Match bullet points and other list items
          const bulletMatch = trimmedLine.match(/^[-•*]\s*(.+)$/);
          if (bulletMatch) {
            titles.push(bulletMatch[1].trim());
            continue;
          }
        }
        
        return titles.filter(title => title.length > 0);
      };

      const sectionTitles = extractSectionTitles(outline);
      
      if (sectionTitles.length === 0) {
        return { success: false, error: 'No valid sections found in outline' };
      }

      // Check if sections already exist
      const { data: existingSections } = await supabase
        .from('proposal_sections')
        .select('section_title')
        .eq('project_id', projectId);

      const existingTitles = existingSections?.map(s => s.section_title) || [];
      const newTitles = sectionTitles.filter(title => !existingTitles.includes(title));

      if (newTitles.length === 0) {
        updateProgress({ 
          stepProgress: 100,
          overallProgress: calculateOverallProgress('sections', 100)
        });
        return { success: true, data: sectionTitles };
      }

      // Create sections
      for (let i = 0; i < newTitles.length; i++) {
        const title = newTitles[i];
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

        // Get user's current organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_organization_id')
          .eq('profile_id', session.user.id)
          .single();

        if (!profile?.current_organization_id) {
          throw new Error('User organization not found');
        }

        await supabase
          .from('proposal_sections')
          .insert({
            project_id: projectId,
            user_id: session.user.id,
            section_title: title,
            content: '',
            organization_id: profile.current_organization_id
          });

        const stepProgress = Math.round(((i + 1) / newTitles.length) * 100);
        updateProgress({ 
          stepProgress,
          overallProgress: calculateOverallProgress('sections', stepProgress)
        });

        // Small delay to maintain order
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { success: true, data: sectionTitles };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create sections';
      return { success: false, error: errorMessage };
    }
  }, [projectId, updateProgress, calculateOverallProgress]);

  // Step 4: Generate Content for All Sections
  const executeContentStep = useCallback(async (): Promise<StepResult> => {
    try {
      updateProgress({ 
        currentStep: 'content', 
        stepProgress: 0,
        overallProgress: calculateOverallProgress('content', 0)
      });

      // Get all sections
      const { data: sections } = await supabase
        .from('proposal_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (!sections || sections.length === 0) {
        return { success: false, error: 'No sections found to generate content for' };
      }

      const sectionsNeedingContent = sections.filter(s => !s.content?.trim());
      
      if (sectionsNeedingContent.length === 0) {
        updateProgress({ 
          stepProgress: 100,
          overallProgress: calculateOverallProgress('content', 100)
        });
        return { success: true };
      }

      // Generate content for each section
      let completed = 0;
      const errors: string[] = [];

      for (const section of sectionsNeedingContent) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-section-content', {
            body: {
              sectionTitle: section.section_title,
              projectId: projectId,
              userId: session?.user.id
            },
          });

          if (error || !data?.content) {
            errors.push(section.section_title);
          } else {
            // Update section with generated content
            await supabase
              .from('proposal_sections')
              .update({ content: data.content })
              .eq('section_id', section.section_id);
          }

          completed++;
          const stepProgress = Math.round((completed / sectionsNeedingContent.length) * 100);
          updateProgress({ 
            stepProgress,
            overallProgress: calculateOverallProgress('content', stepProgress)
          });

          // Delay between generations
          if (completed < sectionsNeedingContent.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          errors.push(section.section_title);
          completed++;
        }
      }

      if (errors.length === sectionsNeedingContent.length) {
        return { success: false, error: 'Failed to generate content for any sections' };
      }

      return { 
        success: true, 
        data: { 
          totalSections: sectionsNeedingContent.length,
          successfulSections: sectionsNeedingContent.length - errors.length,
          errors 
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      return { success: false, error: errorMessage };
    }
  }, [projectId, session, updateProgress, calculateOverallProgress]);

  // Step 5: Proposal Evaluation
  const executeEvaluationStep = useCallback(async (): Promise<StepResult> => {
    try {
      updateProgress({ 
        currentStep: 'evaluation', 
        stepProgress: 0,
        overallProgress: calculateOverallProgress('evaluation', 0)
      });

      // Check if evaluation already exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('evaluation')
        .eq('project_id', projectId)
        .single();

      if (existingProject?.evaluation?.trim()) {
        updateProgress({ 
          stepProgress: 100,
          overallProgress: calculateOverallProgress('evaluation', 100)
        });
        return { success: true, data: existingProject.evaluation };
      }

      // Get proposal sections and analysis for evaluation
      const [sectionsResult, analysisResult] = await Promise.all([
        supabase.from('proposal_sections').select('*').eq('project_id', projectId),
        supabase.from('projects').select('analysis').eq('project_id', projectId).single()
      ]);

      updateProgress({ 
        stepProgress: 20,
        overallProgress: calculateOverallProgress('evaluation', 20)
      });

      if (!sectionsResult.data || sectionsResult.data.length === 0) {
        return { success: false, error: 'No proposal sections found for evaluation' };
      }

      if (!analysisResult.data?.analysis) {
        return { success: false, error: 'No RFP analysis found for evaluation' };
      }

      updateProgress({ 
        stepProgress: 40,
        overallProgress: calculateOverallProgress('evaluation', 40)
      });

      // Call evaluation function
      const { data: evaluationData, error: evaluationError } = await supabase.functions.invoke('evaluate-proposal', {
        body: {
          projectId,
          sections: sectionsResult.data,
          analysis: analysisResult.data.analysis
        }
      });

      updateProgress({ 
        stepProgress: 80,
        overallProgress: calculateOverallProgress('evaluation', 80)
      });

      if (evaluationError) throw new Error(evaluationError.message);
      if (!evaluationData?.evaluation) throw new Error("Invalid response from evaluation service");

      // Save evaluation
      const { error: updateError } = await supabase
        .from('projects')
        .update({ evaluation: evaluationData.evaluation })
        .eq('project_id', projectId);

      if (updateError) throw updateError;

      updateProgress({ 
        stepProgress: 100,
        overallProgress: calculateOverallProgress('evaluation', 100)
      });

      return { success: true, data: evaluationData.evaluation };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to evaluate proposal';
      return { success: false, error: errorMessage };
    }
  }, [projectId, updateProgress, calculateOverallProgress]);

  // Main automation function
  const startAutomation = useCallback(async () => {
    if (!session?.user) {
      toast.error('You must be logged in to use automation');
      return;
    }

    updateProgress({
      isRunning: true,
      isPaused: false,
      startTime: new Date(),
      errors: [],
      completedSteps: []
    });

    const toastId = toast.loading('Starting automated proposal creation...', {
      description: 'This process may take 10-15 minutes. Please keep this page open.'
    });

    try {
      // Step 1: Analysis
      const analysisResult = await executeAnalysisStep();
      if (!analysisResult.success) {
        throw new Error(`Analysis failed: ${analysisResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'analysis'] }));

      // Step 2: Outline
      const outlineResult = await executeOutlineStep(analysisResult.data);
      if (!outlineResult.success) {
        throw new Error(`Outline generation failed: ${outlineResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'outline'] }));

      // Step 3: Sections
      const sectionsResult = await executeSectionsStep(outlineResult.data);
      if (!sectionsResult.success) {
        throw new Error(`Section creation failed: ${sectionsResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'sections'] }));

      // Step 4: Content
      const contentResult = await executeContentStep();
      if (!contentResult.success) {
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'content'] }));

      // Step 5: Evaluation
      const evaluationResult = await executeEvaluationStep();
      if (!evaluationResult.success) {
        throw new Error(`Evaluation failed: ${evaluationResult.error}`);
      }
      setProgress(prev => ({ 
        ...prev,
        completedSteps: [...prev.completedSteps, 'evaluation'],
        currentStep: 'completed' as AutomationStep,
        overallProgress: 100,
        isRunning: false
      }));

      toast.dismiss(toastId);
      toast.success('Automated proposal creation completed!', {
        description: 'Your complete proposal is ready for review.'
      });

    } catch (error) {
      console.error('Automation error:', error);
      setProgress(prev => ({
        ...prev,
        isRunning: false,
        errors: [...prev.errors, { 
          step: prev.currentStep, 
          message: error instanceof Error ? error.message : 'Unknown error'
        }]
      }));

      toast.dismiss(toastId);
      toast.error('Automation failed', {
        description: error instanceof Error ? error.message : 'Please try again or continue manually.'
      });
    }
  }, [
    session,
    executeAnalysisStep,
    executeOutlineStep,
    executeSectionsStep,
    executeContentStep,
    executeEvaluationStep,
    updateProgress
  ]);

  const stopAutomation = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false
    }));
    toast.info('Automation stopped', {
      description: 'You can continue the process manually or restart automation.'
    });
  }, []);

  const resetAutomation = useCallback(() => {
    setProgress({
      currentStep: 'analysis',
      stepProgress: 0,
      overallProgress: 0,
      isRunning: false,
      isPaused: false,
      completedSteps: [],
      errors: []
    });
  }, []);

  return {
    progress,
    startAutomation,
    stopAutomation,
    resetAutomation
  };
}