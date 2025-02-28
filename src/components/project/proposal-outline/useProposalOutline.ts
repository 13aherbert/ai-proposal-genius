
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
        toast({
          title: "Error",
          description: "Failed to load saved outline",
          variant: "destructive",
        });
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
      toast({
        title: "Success",
        description: "Outline cleared successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error clearing outline:', error);
      toast({
        title: "Error",
        description: "Failed to clear outline",
        variant: "destructive",
      });
    }
  };

  const handleGenerateOutline = async () => {
    if (!analysis) {
      toast({
        title: "Error",
        description: "Please analyze the RFP first",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Outline generated and saved successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating outline:', error);
      setError("Failed to generate outline. Please try again.");
      toast({
        title: "Error",
        description: "Failed to generate outline",
        variant: "destructive",
      });
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
