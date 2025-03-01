
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  proposal_outline: string | null;
}

export function useProposalOutline(projectId: string, analysis: string | null) {
  const [outline, setOutline] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize outline from project data
  useEffect(() => {
    const loadSavedOutline = async () => {
      try {
        setIsLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select<string, Project>('proposal_outline')
          .eq('project_id', projectId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (data?.proposal_outline) {
          setOutline(data.proposal_outline);
        }
      } catch (error) {
        console.error('Error loading saved outline:', error);
        toast.error("Failed to load saved outline", {
          description: "We couldn't retrieve your saved outline. Please try refreshing the page."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedOutline();
  }, [projectId]);

  const handleReset = async () => {
    try {
      setIsGenerating(true);
      toast.loading("Resetting outline...");
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ proposal_outline: null })
        .eq('project_id', projectId);

      if (updateError) throw updateError;

      setOutline(null);
      setError(null);
      setProgress(0);
      
      toast.dismiss();
      toast.success("Outline cleared successfully", {
        description: "You can now generate a new outline."
      });
    } catch (error) {
      console.error('Error clearing outline:', error);
      toast.dismiss();
      toast.error("Failed to clear outline", {
        description: "Please try again or reload the page."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!analysis) {
      toast.error("Analysis required", {
        description: "Please analyze the RFP first before generating an outline."
      });
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);
    toast.loading("Generating outline...");

    try {
      // Simulate progress during generation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      // Generate outline using edge function
      const { data: generatedData, error: functionError } = await supabase.functions.invoke<{ outline: string }>('generate-proposal-outline', {
        body: { projectId, analysis }
      });

      clearInterval(progressInterval);

      if (functionError) throw new Error(functionError.message);
      if (!generatedData?.outline) throw new Error("Invalid response from outline generation");

      // Save the outline to the database
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          proposal_outline: generatedData.outline,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId);

      if (updateError) throw updateError;

      setProgress(100);
      setOutline(generatedData.outline);
      
      toast.dismiss();
      toast.success("Outline generated successfully", {
        description: "Your proposal outline is ready to review and has been saved."
      });
    } catch (error) {
      console.error('Error generating outline:', error);
      setError("Failed to generate outline. Please try again.");
      
      toast.dismiss();
      toast.error("Failed to generate outline", {
        description: error instanceof Error ? error.message : "Please try again or contact support."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    outline,
    isGenerating,
    isLoading,
    error,
    progress,
    handleGenerateOutline,
    handleReset
  };
}
