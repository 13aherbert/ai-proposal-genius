import { useState, useCallback, useEffect } from 'react';
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

const STEP_ORDER: AutomationStep[] = ['analysis', 'outline', 'sections', 'content', 'evaluation'];

/**
 * Persist the automation state to the projects table so the Overview tab
 * (and any other consumer) always reads the same source of truth.
 */
async function persistAutomationState(
  projectId: string,
  step: AutomationStep,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  progress: number,
  error?: string,
) {
  const update: Record<string, unknown> = {
    automation_step: step,
    automation_status: status,
    automation_progress: progress,
  };

  if (status === 'in_progress' && progress === 0) {
    update.automation_started_at = new Date().toISOString();
  }
  if (status === 'completed') {
    update.automation_completed_at = new Date().toISOString();
  }
  if (error) {
    update.automation_error = error;
  }
  if (status === 'in_progress' || status === 'completed') {
    update.automation_error = null; // clear previous error
  }

  await supabase
    .from('projects')
    .update(update)
    .eq('project_id', projectId);
}

/**
 * Derive local progress state from the persisted DB columns so the
 * Overview tab shows the correct status on mount / navigation.
 */
function deriveProgressFromDB(project: {
  automation_status?: string | null;
  automation_step?: string | null;
  automation_progress?: number | null;
  automation_error?: string | null;
  analysis?: string | null;
  proposal_outline?: string | null;
  evaluation?: string | null;
}): AutomationProgress {
  const status = project.automation_status;
  const step = (project.automation_step as AutomationStep) || 'analysis';
  const dbProgress = project.automation_progress ?? 0;

  // If DB says completed, mark all steps done
  if (status === 'completed') {
    return {
      currentStep: 'completed',
      stepProgress: 100,
      overallProgress: 100,
      isRunning: false,
      isPaused: false,
      completedSteps: [...STEP_ORDER],
      errors: [],
    };
  }

  // If DB says failed, mark steps up to the failed one
  if (status === 'failed') {
    const failedIdx = STEP_ORDER.indexOf(step as AutomationStep);
    const completed = failedIdx > 0 ? STEP_ORDER.slice(0, failedIdx) : [];
    return {
      currentStep: step,
      stepProgress: 0,
      overallProgress: dbProgress,
      isRunning: false,
      isPaused: false,
      completedSteps: completed,
      errors: [{ step: step as AutomationStep, message: project.automation_error || 'Step failed' }],
    };
  }

  // If DB says in_progress — the page was likely closed mid-run.
  // Show completed steps up to current and mark current as pending (not running
  // since we don't have the active process anymore).
  if (status === 'in_progress') {
    const currentIdx = STEP_ORDER.indexOf(step as AutomationStep);
    const completed = currentIdx > 0 ? STEP_ORDER.slice(0, currentIdx) : [];
    return {
      currentStep: step,
      stepProgress: 0,
      overallProgress: dbProgress,
      isRunning: false,
      isPaused: false,
      completedSteps: completed,
      errors: [],
    };
  }

  // Fallback: infer from content presence (for projects automated before this fix)
  const completedSteps: AutomationStep[] = [];
  if (project.analysis?.trim()) completedSteps.push('analysis');
  if (project.proposal_outline?.trim()) completedSteps.push('outline');
  // sections & content are in proposal_sections table — can't cheaply check here
  // but if we have evaluation, everything before it must be done
  if (project.evaluation?.trim()) {
    if (!completedSteps.includes('analysis')) completedSteps.push('analysis');
    if (!completedSteps.includes('outline')) completedSteps.push('outline');
    completedSteps.push('sections', 'content', 'evaluation');
  }

  if (completedSteps.length === 5) {
    return {
      currentStep: 'completed',
      stepProgress: 100,
      overallProgress: 100,
      isRunning: false,
      isPaused: false,
      completedSteps,
      errors: [],
    };
  }

  // Find next pending step
  const nextStep = STEP_ORDER.find(s => !completedSteps.includes(s)) || 'analysis';

  return {
    currentStep: nextStep,
    stepProgress: 0,
    overallProgress: completedSteps.length > 0 ? Math.round((completedSteps.length / 5) * 100) : 0,
    isRunning: false,
    isPaused: false,
    completedSteps,
    errors: [],
  };
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
  const [initialized, setInitialized] = useState(false);

  // On mount: load persisted automation state from DB
  useEffect(() => {
    let cancelled = false;
    async function loadState() {
      const { data } = await supabase
        .from('projects')
        .select('automation_status, automation_step, automation_progress, automation_error, analysis, proposal_outline, evaluation')
        .eq('project_id', projectId)
        .single();

      if (cancelled || !data) {
        setInitialized(true);
        return;
      }

      const derived = deriveProgressFromDB(data);
      setProgress(derived);
      setInitialized(true);
    }
    loadState();
    return () => { cancelled = true; };
  }, [projectId]);

  const updateProgress = useCallback((updates: Partial<AutomationProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const calculateOverallProgress = useCallback((step: AutomationStep, stepProgress: number) => {
    const stepWeights: Record<string, number> = {
      analysis: 20,
      outline: 20,
      sections: 15,
      content: 35,
      evaluation: 10
    };

    const currentStepIndex = STEP_ORDER.indexOf(step);
    
    let totalProgress = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      totalProgress += stepWeights[STEP_ORDER[i]];
    }
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
      await persistAutomationState(projectId, 'analysis', 'in_progress', 0);

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
      await persistAutomationState(projectId, 'outline', 'in_progress', calculateOverallProgress('outline', 0));

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
      await persistAutomationState(projectId, 'sections', 'in_progress', calculateOverallProgress('sections', 0));

      const extractSectionTitles = (outline: string): string[] => {
        const lines = outline.split('\n');
        const titles: string[] = [];
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
            let title = trimmed
              .replace(/^#{1,3}\s+/, '')
              .replace(/^\d+\.\s+/, '')
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .trim();
            
            const titleLower = title.toLowerCase();
            const isProposalHeader = titleLower.includes('proposal outline') || 
                                    titleLower.includes('outline') && titleLower.includes('proposal');
            const isAppendices = titleLower.includes('appendix') || 
                                titleLower.includes('appendices');
            
            if (title && title.length > 3 && title.length < 100 && !isProposalHeader && !isAppendices) {
              titles.push(title);
            }
          }
        }
        
        return titles;
      };

      const sectionTitles = extractSectionTitles(outline);
      
      if (sectionTitles.length === 0) {
        return { success: false, error: 'No valid sections found in outline' };
      }

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

      for (let i = 0; i < newTitles.length; i++) {
        const title = newTitles[i];
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          throw new Error("No authenticated user");
        }

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
      await persistAutomationState(projectId, 'content', 'in_progress', calculateOverallProgress('content', 0));

      const { data: sections } = await supabase
        .from('proposal_sections')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

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
      await persistAutomationState(projectId, 'evaluation', 'in_progress', calculateOverallProgress('evaluation', 0));

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

    await persistAutomationState(projectId, 'analysis', 'in_progress', 0);

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
      await persistAutomationState(projectId, 'analysis', 'in_progress', 20);

      // Step 2: Outline
      const outlineResult = await executeOutlineStep(analysisResult.data);
      if (!outlineResult.success) {
        throw new Error(`Outline generation failed: ${outlineResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'outline'] }));
      await persistAutomationState(projectId, 'outline', 'in_progress', 40);

      // Step 3: Sections
      const sectionsResult = await executeSectionsStep(outlineResult.data);
      if (!sectionsResult.success) {
        throw new Error(`Section creation failed: ${sectionsResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'sections'] }));
      await persistAutomationState(projectId, 'sections', 'in_progress', 55);

      // Step 4: Content
      const contentResult = await executeContentStep();
      if (!contentResult.success) {
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }
      setProgress(prev => ({ ...prev, completedSteps: [...prev.completedSteps, 'content'] }));
      await persistAutomationState(projectId, 'content', 'in_progress', 90);

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

      await persistAutomationState(projectId, 'completed', 'completed', 100);

      toast.dismiss(toastId);
      toast.success('Automated proposal creation completed!', {
        description: 'Your complete proposal is ready for review.'
      });

    } catch (error) {
      console.error('Automation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      setProgress(prev => ({
        ...prev,
        isRunning: false,
        errors: [...prev.errors, { 
          step: prev.currentStep, 
          message: errorMsg
        }]
      }));

      await persistAutomationState(
        projectId,
        progress.currentStep,
        'failed',
        progress.overallProgress,
        errorMsg,
      );

      toast.dismiss(toastId);
      toast.error('Automation failed', {
        description: errorMsg || 'Please try again or continue manually.'
      });
    }
  }, [
    session,
    projectId,
    executeAnalysisStep,
    executeOutlineStep,
    executeSectionsStep,
    executeContentStep,
    executeEvaluationStep,
    updateProgress,
    progress.currentStep,
    progress.overallProgress,
  ]);

  const stopAutomation = useCallback(async () => {
    setProgress(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false
    }));
    await persistAutomationState(projectId, progress.currentStep, 'in_progress', progress.overallProgress);
    toast.info('Automation stopped', {
      description: 'You can continue the process manually or restart automation.'
    });
  }, [projectId, progress.currentStep, progress.overallProgress]);

  const resetAutomation = useCallback(async () => {
    setProgress({
      currentStep: 'analysis',
      stepProgress: 0,
      overallProgress: 0,
      isRunning: false,
      isPaused: false,
      completedSteps: [],
      errors: []
    });
    await persistAutomationState(projectId, 'analysis', 'pending', 0);
  }, [projectId]);

  return {
    progress,
    startAutomation,
    stopAutomation,
    resetAutomation,
    initialized,
  };
}
