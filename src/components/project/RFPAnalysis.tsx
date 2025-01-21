import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRFPAnalysis } from "./rfp-analysis/useRFPAnalysis";
import { AnalysisContent } from "./rfp-analysis/AnalysisContent";
import { parseAnalysis } from "./rfp-analysis/utils";
import type { RFPAnalysisProps } from "./rfp-analysis/types";

export function RFPAnalysis({ filePath, projectId }: RFPAnalysisProps) {
  const {
    analysis,
    isAnalyzing,
    error,
    handleAnalyze,
    handleReset
  } = useRFPAnalysis(filePath, projectId);

  const parsedSections = analysis ? parseAnalysis(analysis) : [];

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
            className="w-full"
          >
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze RFP'}
          </Button>
        )}
        
        {analysis && (
          <AnalysisContent 
            sections={parsedSections} 
            onReset={handleReset} 
          />
        )}
      </CardContent>
    </Card>
  );
}