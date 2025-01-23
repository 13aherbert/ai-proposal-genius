import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRFPAnalysis(filePath: string, projectId: string) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved analysis when component mounts
  useEffect(() => {
    const loadSavedAnalysis = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('analysis')
          .eq('id', projectId)
          .single();

        if (fetchError) throw fetchError;
        if (data?.analysis) {
          setAnalysis(data.analysis);
        }
      } catch (error) {
        console.error('Error loading saved analysis:', error);
        toast.error("Failed to load saved analysis");
      }
    };

    loadSavedAnalysis();
  }, [projectId]);

  const handleReset = async () => {
    try {
      // Update the database to clear the analysis
      const { error: updateError } = await supabase
        .from('projects')
        .update({ analysis: null })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Clear the local state
      setAnalysis(null);
      setError(null);
      toast.success("Analysis cleared successfully");
    } catch (error) {
      console.error('Error clearing analysis:', error);
      toast.error("Failed to clear analysis");
    }
  };

  const handleAnalyze = async () => {
    let currentRetry = 0;
    setIsAnalyzing(true);
    setError(null);

    const attemptAnalysis = async () => {
      try {
        console.log('Starting analysis attempt', currentRetry + 1);
        
        // Validate input parameters
        if (!filePath || !projectId) {
          throw new Error("Missing required parameters: filePath and projectId");
        }

        const requestBody = {
          filePath,
          projectId
        };

        console.log('Sending request with body:', requestBody);

        // Pass the request body directly without stringifying - the SDK will handle it
        const { data, error: functionError } = await supabase.functions.invoke('analyze-rfp', {
          body: requestBody
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error(functionError.message || 'Error calling analysis service');
        }

        if (!data?.analysis) {
          throw new Error("Invalid response from analysis service");
        }

        // Save the analysis to the database
        const { error: updateError } = await supabase
          .from('projects')
          .update({ analysis: data.analysis })
          .eq('id', projectId);

        if (updateError) {
          console.error('Error saving analysis:', updateError);
          throw new Error('Failed to save analysis');
        }

        console.log('Analysis completed and saved successfully:', data);
        setAnalysis(data.analysis);
        setError(null);
        toast.success("Analysis completed and saved successfully");
      } catch (error) {
        console.error('Analysis error:', error);
        
        if (currentRetry < 2) {
          currentRetry++;
          const delay = 1000 * currentRetry;
          console.log(`Retry attempt ${currentRetry} failed, waiting ${delay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptAnalysis();
        }
        
        let errorMessage = "Failed to analyze RFP document. ";
        if (error instanceof Error) {
          errorMessage += error.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    };

    await attemptAnalysis();
  };

  return {
    analysis,
    isAnalyzing,
    error,
    handleAnalyze,
    handleReset
  };
}