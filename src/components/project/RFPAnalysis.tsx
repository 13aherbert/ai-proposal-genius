import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
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
  const RETRY_DELAY = 2000; // 2 seconds

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting analysis with file path:', filePath, 'and project ID:', projectId);
      
      const requestBody = {
        filePath,
        projectId
      };

      console.log('Sending request with body:', requestBody);

      const { data, error: functionError } = await supabase.functions.invoke('analyze-rfp', {
        body: requestBody
      });

      console.log('Response:', data, 'Error:', functionError);

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw functionError;
      }

      if (!data || !data.analysis) {
        throw new Error("Invalid response from analysis service");
      }

      setAnalysis(data.analysis);
      setRetryCount(0);
      setError(null);
      toast.success("Analysis completed successfully");
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('credit balance')) {
          setError("The AI service is currently unavailable due to credit limitations. Please try again later or contact support.");
        } else if (error.message.includes('rate limit')) {
          setError("The AI service is currently experiencing high demand. Please try again in a few minutes.");
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Failed to send')) {
          setError("Unable to connect to the analysis service. Please check your connection and try again.");
        } else {
          setError(`Analysis failed: ${error.message}`);
        }
      } else {
        setError("Failed to analyze RFP document. Please try again.");
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
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {!analysis && (
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full"
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