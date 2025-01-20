import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

export function RFPAnalysis({ filePath, projectId }: RFPAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const MAX_RETRIES = 3;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-rfp', {
        body: { filePath, projectId }
      });

      if (error) {
        // Handle rate limit errors
        if ((error.message?.includes('rate limit') || error.status === 429) && retryCount < MAX_RETRIES) {
          const waitTime = 5000 * Math.pow(2, retryCount);
          setRetryCount(prev => prev + 1);
          toast.error(`Rate limit reached. Retrying in ${waitTime/1000} seconds...`);
          setTimeout(() => handleAnalyze(), waitTime);
          return;
        }

        // Handle credit balance errors
        if (error.message?.includes('credit balance is too low')) {
          setError("The AI service is currently unavailable due to credit limitations. Please try again later or contact support.");
          throw new Error("Anthropic API credit balance too low");
        }

        throw error;
      }

      setAnalysis(data.analysis);
      setRetryCount(0);
      setError(null);
    } catch (error) {
      console.error('Error analyzing RFP:', error);
      
      // Set user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('credit balance')) {
          setError("The AI service is currently unavailable due to credit limitations. Please try again later or contact support.");
        } else if (error.message.includes('rate limit')) {
          setError("The AI service is currently experiencing high demand. Please try again in a few minutes.");
        } else {
          setError(`Analysis failed: ${error.message}`);
        }
      } else {
        setError("Failed to analyze RFP document");
      }
      
      toast.error(
        error instanceof Error 
          ? `Analysis failed: ${error.message}`
          : "Failed to analyze RFP document"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!analysis && (
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
          >
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze RFP'}
          </Button>
        )}
        
        {analysis && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap font-mono">{analysis}</div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setAnalysis(null);
                setRetryCount(0);
                setError(null);
              }}
            >
              New Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}