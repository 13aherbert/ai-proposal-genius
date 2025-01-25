import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRFPAnalysis } from "./rfp-analysis/useRFPAnalysis";
import { AnalysisContent } from "./rfp-analysis/AnalysisContent";
import { parseAnalysis } from "./rfp-analysis/utils";
import { AIProgress } from "@/components/shared/AIProgress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  
  const parsedSections = analysis ? parseAnalysis(analysis) : [];

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2">
              <div>
                <CardTitle>RFP Summary</CardTitle>
                <CardDescription>AI-generated analysis of your RFP document</CardDescription>
              </div>
              <ChevronDown 
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}