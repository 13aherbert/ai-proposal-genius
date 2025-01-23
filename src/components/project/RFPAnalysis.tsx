import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRFPAnalysis } from "./rfp-analysis/useRFPAnalysis";
import { AnalysisContent } from "./rfp-analysis/AnalysisContent";
import { parseAnalysis } from "./rfp-analysis/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

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
        <CardTitle>RFP Summary</CardTitle>
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
          <Button 
            disabled
            className="w-full"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </Button>
        )}
        
        {analysis && (
          <Accordion type="single" collapsible defaultValue="analysis">
            <AccordionItem value="analysis">
              <AccordionTrigger>Analysis Results</AccordionTrigger>
              <AccordionContent>
                <AnalysisContent 
                  sections={parsedSections} 
                  onReset={handleReset} 
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}