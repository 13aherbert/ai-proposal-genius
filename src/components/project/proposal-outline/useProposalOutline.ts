import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProposalOutline(projectId: string, analysis: string | null) {
  const [outline, setOutline] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const { data, error: functionError } = await supabase.functions.invoke('generate-proposal-outline', {
        body: { projectId, analysis }
      });

      if (functionError) throw new Error(functionError.message);
      if (!data?.outline) throw new Error("Invalid response from outline generation");

      // Save the outline to the database
      const { error: updateError } = await supabase
        .from('projects')
        .update({ proposal_outline: data.outline })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setOutline(data.outline);
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