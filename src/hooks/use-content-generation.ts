import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { CircuitBreaker, enhancedRetry, RateLimiter, ApiHealthMonitor } from '@/utils/api-resilience';
import type { ProposalSection } from '@/components/project/proposal-draft/useProposalSections';
import * as React from 'react';

interface GenerationProgress {
  currentSection: string;
  completed: number;
  total: number;
  isGenerating: boolean;
  errors: string[];
  successes: string[];
  knowledgeBaseWarnings: Array<{
    sectionTitle: string;
    coverageScore: number;
    missingTopics: string[];
  }>;
}

interface ContentGenerationOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  enableCircuitBreaker?: boolean;
  enableRateLimiting?: boolean;
  strictMode?: boolean;
}

export function useContentGeneration() {
  const { session } = useAuth();
  const [progress, setProgress] = useState<GenerationProgress>({
    currentSection: '',
    completed: 0,
    total: 0,
    isGenerating: false,
    errors: [],
    successes: [],
    knowledgeBaseWarnings: []
  });

  // Initialize resilience components
  const circuitBreaker = new CircuitBreaker(5, 30000); // 5 failures, 30s timeout (less strict)
  const rateLimiter = new RateLimiter(8, 60000, 2000); // 8 req/min, 2s min delay
  const healthMonitor = new ApiHealthMonitor();

  // Reset circuit breaker when hook initializes to clear any previous failures
  React.useEffect(() => {
    circuitBreaker.reset();
    console.log('Circuit breaker reset on hook initialization');
  }, []);

  const generateSectionContent = useCallback(async (
    section: ProposalSection,
    projectId: string,
    options: ContentGenerationOptions = {}
  ): Promise<{ success: boolean; content?: string; error?: string }> => {
    const {
      maxRetries = 4,
      baseDelay = 2000,
      maxDelay = 30000,
      enableCircuitBreaker = true,
      enableRateLimiting = true,
      strictMode = false
    } = options;

    if (!session?.user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Rate limiting (commented out - using circuit breaker and retry logic instead)
      // if (enableRateLimiting) {
      //   await rateLimiter.acquire();
      // }

      const operation = async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-section-content', {
            body: { 
              projectId, 
              sectionTitle: section.section_title, 
              userId: session.user.id,
              strictMode: strictMode
            }
          });

          if (error) {
            healthMonitor.recordError();
            
            // Check for specific error types
            const errorMessage = error.message?.toLowerCase() || '';
            if (errorMessage.includes('insufficient_knowledge_base')) {
              throw new Error('INSUFFICIENT_KNOWLEDGE_BASE');
            }
            if (errorMessage.includes('content_validation_failed')) {
              throw new Error('CONTENT_VALIDATION_FAILED');
            }
            if (errorMessage.includes('overloaded') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
              throw new Error('RATE_LIMITED');
            }
            throw error;
          }

          if (!data?.content) {
            healthMonitor.recordError();
            throw new Error('No content generated');
          }

          healthMonitor.recordSuccess(Date.now() - startTime);
          return data.content;
        } catch (error) {
          healthMonitor.recordError();
          throw error;
        }
      };

      // Apply circuit breaker if enabled
      const finalOperation = enableCircuitBreaker 
        ? () => circuitBreaker.execute(operation)
        : operation;

      // Execute with enhanced retry logic
      const content = await enhancedRetry(finalOperation, maxRetries, baseDelay, maxDelay);
      
      return { success: true, content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to generate content for ${section.section_title}:`, error);
      return { success: false, error: errorMessage };
    }
  }, [session, circuitBreaker, rateLimiter, healthMonitor]);

  const verifyContentSaved = useCallback(async (sectionId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('proposal_sections')
        .select('content')
        .eq('section_id', sectionId)
        .single();
      
      return !!(data?.content && data.content.trim().length > 0);
    } catch (error) {
      console.error('Error verifying content:', error);
      return false;
    }
  }, []);

  const generateAllContent = useCallback(async (
    sections: ProposalSection[],
    projectId: string,
    onUpdateSection: (sectionId: string, content: string, title: string) => Promise<void>,
    options: ContentGenerationOptions = {}
  ) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to generate content');
      return;
    }

    if (sections.length === 0) {
      toast.error('No sections found', {
        description: 'Please create sections first before generating content.'
      });
      return;
    }

    // Reset progress
    setProgress({
      currentSection: '',
      completed: 0,
      total: sections.length,
      isGenerating: true,
      errors: [],
      successes: [],
      knowledgeBaseWarnings: []
    });

    const toastId = toast.loading('Starting content generation...', {
      description: `Generating content for ${sections.length} sections`
    });

    const results = {
      successes: [] as string[],
      errors: [] as string[],
      partialFailures: [] as string[]
    };

    try {
      // Generate content for each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        setProgress(prev => ({
          ...prev,
          currentSection: section.section_title,
          completed: i
        }));

        console.log(`Generating content for section: ${section.section_title}`);

        try {
          const result = await generateSectionContent(section, projectId, options);

          if (result.success && result.content) {
            try {
              await onUpdateSection(section.section_id, result.content, section.section_title);
              
              // Verify content was actually saved
              const contentSaved = await verifyContentSaved(section.section_id);
              if (contentSaved) {
                results.successes.push(section.section_title);
              } else {
                results.partialFailures.push(section.section_title);
              }
            } catch (updateError) {
              console.error(`Failed to update section ${section.section_title}:`, updateError);
              results.errors.push(section.section_title);
            }
          } else {
            // Check if content was somehow generated despite the error
            const contentSaved = await verifyContentSaved(section.section_id);
            if (contentSaved) {
              results.successes.push(section.section_title);
            } else {
              results.errors.push(section.section_title);
            }
          }

          setProgress(prev => ({
            ...prev,
            completed: i + 1,
            successes: results.successes,
            errors: results.errors
          }));

          // Progressive delay - shorter delays for successful requests
          if (i < sections.length - 1) {
            const delayTime = result.success ? 1500 : 3000;
            await new Promise(resolve => setTimeout(resolve, delayTime));
          }
        } catch (batchError) {
          const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
          
          if (errorMessage.includes('INSUFFICIENT_KNOWLEDGE_BASE')) {
            toast.error(`Knowledge Base Insufficient: ${section.section_title}`, {
              description: 'Please add more relevant information to your knowledge base for this section.'
            });
          } else if (errorMessage.includes('CONTENT_VALIDATION_FAILED')) {
            toast.error(`Content Validation Failed: ${section.section_title}`, {
              description: 'Generated content contains unverified claims. Please enhance your knowledge base.'
            });
          } else {
            toast.error(`Failed to generate: ${section.section_title}`, {
              description: errorMessage
            });
          }
          
          results.errors.push(section.section_title);
          
          setProgress(prev => ({
            ...prev,
            completed: i + 1,
            successes: results.successes,
            errors: results.errors
          }));
        }
      }

      // Final results
      const totalSuccess = results.successes.length;
      const totalErrors = results.errors.length + results.partialFailures.length;

      toast.dismiss(toastId);

      if (totalSuccess === sections.length) {
        toast.success(`Successfully generated content for all ${totalSuccess} sections!`, {
          description: 'You can now review and edit the generated content.'
        });
      } else if (totalSuccess > 0) {
        toast.warning(`Generated content for ${totalSuccess} sections`, {
          description: `${totalErrors} section(s) failed: ${[...results.errors, ...results.partialFailures].join(', ')}. You can try generating them individually.`
        });
      } else {
        toast.error('Failed to generate content for any sections', {
          description: 'Please try again or generate sections individually.'
        });
      }

      // Log health metrics
      const metrics = healthMonitor.getHealthMetrics();
      console.log('Generation health metrics:', metrics);

    } catch (error) {
      console.error('Error in bulk content generation:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate content', {
        description: 'Please try again or generate sections individually.'
      });
    } finally {
      setProgress(prev => ({
        ...prev,
        isGenerating: false,
        currentSection: ''
      }));
    }
  }, [session, generateSectionContent, verifyContentSaved, healthMonitor]);

  const retryFailedSections = useCallback(async (
    failedSectionTitles: string[],
    allSections: ProposalSection[],
    projectId: string,
    onUpdateSection: (sectionId: string, content: string, title: string) => Promise<void>
  ) => {
    const failedSections = allSections.filter(section => 
      failedSectionTitles.includes(section.section_title)
    );

    if (failedSections.length === 0) {
      toast.error('No failed sections to retry');
      return;
    }

    await generateAllContent(failedSections, projectId, onUpdateSection, {
      maxRetries: 3,
      baseDelay: 3000,
      strictMode: false // Retry with less strict mode
    });
  }, [generateAllContent]);

  return {
    progress,
    generateSectionContent,
    generateAllContent,
    retryFailedSections
  };
}