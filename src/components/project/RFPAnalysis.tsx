import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRFPAnalysis } from "./rfp-analysis/useRFPAnalysis";
import { AnalysisContent } from "./rfp-analysis/AnalysisContent";
import { parseAnalysis } from "./rfp-analysis/utils";
import { AIProgress } from "@/components/shared/AIProgress";

interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

export function RFPAnalysis({ filePath, projectId }: RFPAnalysisProps) {
  const {
    analysis,
    isAnalyzing,
    error,
    progress,
    handleAnalyze,
    handleReset
  } = useRFPAnalysis(filePath, projectId);

  const parsedSections = analysis ? parseAnalysis(analysis) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start">
          <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
            RFP Summary
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your RFP document
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!analysis && !isAnalyzing && (
          <Button 
            onClick={handleAnalyze} 
            className="w-full"
          >
            Analyze RFP
          </Button>
        )}

        {isAnalyzing && (
          <div className="space-y-4">
            <Button 
              disabled
              className="w-full"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </Button>
            <AIProgress progress={progress} label="Analyzing RFP" />
          </div>
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