import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProposalOutline(projectId: string, analysis: string | null) {
  const [outline, setOutline] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize outline from project data
  useEffect(() => {
    const loadSavedOutline = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('proposal_outline')
          .eq('id', projectId)
          .single();

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
        .eq('id', projectId);

      if (updateError) throw updateError;

      setOutline(null);
      setError(null);
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

    try {
      // Generate outline using edge function
      const { data: generatedData, error: functionError } = await supabase.functions.invoke('generate-proposal-outline', {
        body: { projectId, analysis }
      });

      if (functionError) throw new Error(functionError.message);
      if (!generatedData?.outline) throw new Error("Invalid response from outline generation");

      // Save the outline to the database
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          proposal_outline: generatedData.outline,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) throw updateError;

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
    handleGenerateOutline,
    handleReset
  };
}