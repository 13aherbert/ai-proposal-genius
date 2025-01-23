import { useState, useEffect } from "react";
import { toast } from "sonner";
import { loadSavedAnalysis, clearAnalysis, analyzeRFP } from "./api/rfpAnalysisApi";
import { retryOperation } from "./utils/retryOperation";

/**
 * Hook for managing RFP analysis state and operations
 * @param filePath - Path to the RFP file to analyze
 * @param projectId - ID of the project
 */
export function useRFPAnalysis(filePath: string, projectId: string) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved analysis when component mounts
  useEffect(() => {
    const initializeAnalysis = async () => {
      try {
        const savedAnalysis = await loadSavedAnalysis(projectId);
        if (savedAnalysis) {
          setAnalysis(savedAnalysis);
        }
      } catch (error) {
        console.error('Error loading saved analysis:', error);
        toast.error("Failed to load saved analysis");
      }
    };

    initializeAnalysis();
  }, [projectId]);

  const handleReset = async () => {
    try {
      await clearAnalysis(projectId);
      setAnalysis(null);
      setError(null);
      toast.success("Analysis cleared successfully");
    } catch (error) {
      console.error('Error clearing analysis:', error);
      toast.error("Failed to clear analysis");
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Validate input parameters
      if (!filePath || !projectId) {
        throw new Error("Missing required parameters: filePath and projectId");
      }

      const result = await retryOperation(async () => {
        console.log('Starting analysis attempt');
        return analyzeRFP(filePath, projectId);
      });

      setAnalysis(result);
      toast.success("Analysis completed and saved successfully");
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to analyze RFP document. ${error.message}`
        : "Failed to analyze RFP document.";
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analysis,
    isAnalyzing,
    error,
    handleAnalyze,
    handleReset
  };
}