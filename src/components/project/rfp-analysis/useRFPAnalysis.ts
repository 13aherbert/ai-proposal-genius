import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useRFPAnalysis(filePath: string, projectId: string) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleReset = () => {
    setAnalysis(null);
    setRetryCount(0);
    setError(null);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    let currentRetry = 0;
    
    const attemptAnalysis = async () => {
      try {
        console.log('Starting analysis attempt', currentRetry + 1);
        
        const requestBody = {
          filePath: filePath,
          projectId: projectId
        };

        console.log('Sending request with body:', requestBody);

        const { data, error: functionError } = await supabase.functions.invoke('analyze-rfp', {
          body: requestBody
        });

        if (functionError) throw functionError;
        if (!data?.analysis) throw new Error("Invalid response from analysis service");

        setAnalysis(data.analysis);
        setRetryCount(0);
        setError(null);
        toast.success("Analysis completed successfully");
      } catch (error) {
        console.error('Analysis error:', error);
        
        if (currentRetry < MAX_RETRIES - 1) {
          currentRetry++;
          const delay = RETRY_DELAY * Math.pow(2, currentRetry - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptAnalysis();
        }
        
        const errorMessage = error instanceof Error 
          ? error.message.includes('Failed to fetch')
            ? "Unable to connect to the analysis service. Please check your connection and try again."
            : `Analysis failed: ${error.message}`
          : "Failed to analyze RFP document. Please try again.";
        
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