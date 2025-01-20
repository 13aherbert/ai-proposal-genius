import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

export function RFPAnalysis({ filePath, projectId }: RFPAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-rfp', {
        body: { filePath, projectId }
      });

      if (error) {
        if (error.message?.includes('rate limit') && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          toast.error("Rate limit reached. Retrying in 2 seconds...");
          setTimeout(() => handleAnalyze(), 2000);
          return;
        }
        throw error;
      }

      setAnalysis(data.analysis);
      setRetryCount(0);
    } catch (error) {
      console.error('Error analyzing RFP:', error);
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