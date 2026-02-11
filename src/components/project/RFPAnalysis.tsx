
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRFPAnalysis } from "./rfp-analysis/useRFPAnalysis";
import { AnalysisContent } from "./rfp-analysis/AnalysisContent";
import { parseAnalysis } from "./rfp-analysis/utils";
import { AIProgress } from "@/components/shared/AIProgress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

export function RFPAnalysis({ filePath, projectId }: RFPAnalysisProps) {
  const {
    analysis,
    isAnalyzing,
    isLoading,
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
          <CardTitle className="text-xl sm:text-2xl font-semibold leading-none tracking-tight">
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
        
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!analysis && !isAnalyzing && !isLoading && (
          <Button 
            onClick={handleAnalyze} 
            className="w-full"
            disabled={!filePath}
          >
            {!filePath ? "Upload an RFP document first" : "Analyze RFP"}
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
        
        {analysis && !isAnalyzing && !isLoading && (
          <div className="space-y-4">
            <AnalysisContent 
              sections={parsedSections} 
              onReset={handleReset}
            />
            
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-500 hover:bg-red-500/10 text-red-500 w-full sm:w-auto"
                  >
                    Reset Analysis
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the current analysis. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Yes, reset analysis
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-1 w-full sm:w-auto"
              >
                <RefreshCw className="h-3 w-3" />
                Analyze Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
