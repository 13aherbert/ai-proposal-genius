import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const MAX_BACKOFF = 10000;

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
        
        const requestBody = {
          filePath: filePath.trim(),
          projectId: projectId.trim()
        };

        console.log('Sending request with body:', requestBody);

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

        setAnalysis(data.analysis);
        setError(null);
        toast.success("Analysis completed successfully");
      } catch (error) {
        console.error('Analysis error:', error);
        
        if (currentRetry < MAX_RETRIES - 1) {
          currentRetry++;
          const baseDelay = Math.min(RETRY_DELAY * Math.pow(2, currentRetry - 1), MAX_BACKOFF);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          console.log(`Retry attempt ${currentRetry} failed, waiting ${delay}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptAnalysis();
        }
        
        let errorMessage = "Failed to analyze RFP document. ";
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            errorMessage = "Unable to connect to the analysis service. Please check your connection and try again.";
          } else if (error.message.includes('timeout')) {
            errorMessage = "The analysis request timed out. Please try again.";
          } else {
            errorMessage += error.message;
          }
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