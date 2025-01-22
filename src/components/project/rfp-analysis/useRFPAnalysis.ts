import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRFPAnalysis(filePath: string, projectId: string) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    let currentRetry = 0;
    setIsAnalyzing(true);
    setError(null);

    const attemptAnalysis = async () => {
      try {
        console.log(`Starting analysis attempt ${currentRetry + 1}`);
        
        // Validate input parameters
        if (!filePath || !projectId) {
          throw new Error("Missing required parameters: filePath and projectId");
        }

        const requestBody = {
          filePath,
          projectId
        };

        console.log('Sending request with body:', requestBody);

        const { data, error: functionError } = await supabase.functions.invoke('analyze-rfp', {
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (functionError) {
          console.error('Function error:', functionError);
          throw new Error(functionError.message || 'Error calling analysis service');
        }

        if (!data?.analysis) {
          throw new Error("Invalid response from analysis service");
        }

        console.log('Analysis completed successfully:', data);
        setAnalysis(data.analysis);
        setError(null);
        toast.success("Analysis completed successfully");
      } catch (error) {
        console.error('Analysis error:', error);
        
        if (currentRetry < 2) { // Reduced retries for faster feedback
          currentRetry++;
          const delay = 1000 * currentRetry; // Simple linear backoff
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