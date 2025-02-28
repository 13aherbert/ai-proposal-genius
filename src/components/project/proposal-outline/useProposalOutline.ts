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

  // Initialize outline from project data
  useEffect(() => {
    const loadSavedOutline = async () => {
      try {
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
        toast.error("Failed to load saved outline");
      }
    };

    loadSavedOutline();
  }, [projectId]);

  const handleReset = async () => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ proposal_outline: null })
        .eq('project_id', projectId);

      if (updateError) throw updateError;

      setOutline(null);
      setError(null);
      setProgress(0);
      toast.success("Outline cleared successfully");
    } catch (error) {
      console.error('Error clearing outline:', error);
      toast.error("Failed to clear outline");
    }
  };

  const handleGenerateOutline = async () => {
    if (!analysis) {
      toast.error("Please analyze the RFP first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(0);

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
      toast.success("Outline generated and saved successfully!");
    } catch (error) {
      console.error('Error generating outline:', error);
      setError("Failed to generate outline. Please try again.");
      toast.error("Failed to generate outline");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    outline,
    isGenerating,
    error,
    progress,
    handleGenerateOutline,
    handleReset
  };
}
