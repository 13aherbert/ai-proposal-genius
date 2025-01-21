import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertTriangle, Calendar, CheckSquare, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RFPAnalysisProps {
  filePath: string;
  projectId: string;
}

interface AnalysisSection {
  title: string;
  content: string[];
  icon: React.ReactNode;
}

export function RFPAnalysis({ filePath, projectId }: RFPAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const parseAnalysis = (text: string): AnalysisSection[] => {
    const sections = text.split(/\d\.\s+(?=[A-Z])/);
    const sectionTitles = text.match(/\d\.\s+[A-Z][^:\n]+/g) || [];
    
    return sectionTitles.map((title, index) => {
      const cleanTitle = title.replace(/^\d\.\s+/, '');
      const content = sections[index + 1]
        ?.split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^-\s+/, ''))
        .filter(Boolean) || [];

      const icon = getIconForSection(cleanTitle);
      
      return {
        title: cleanTitle,
        content,
        icon
      };
    });
  };

  const getIconForSection = (title: string) => {
    switch (title) {
      case 'Key Requirements':
        return <CheckSquare className="h-5 w-5" />;
      case 'Timeline & Deadlines':
        return <Calendar className="h-5 w-5" />;
      case 'Evaluation Criteria':
        return <ListChecks className="h-5 w-5" />;
      case 'Required Response Elements':
        return <CheckSquare className="h-5 w-5" />;
      case 'Risk Assessment':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    let currentRetry = 0;
    
    const attemptAnalysis = async () => {
      try {
        console.log('Starting analysis attempt', currentRetry + 1);
        
        // Ensure we're sending properly formatted JSON data
        const requestBody = {
          filePath: filePath,
          projectId: projectId
        };

        console.log('Sending request with body:', requestBody);

        const { data, error: functionError } = await supabase.functions.invoke('analyze-rfp', {
          body: requestBody
        });

        if (functionError) throw functionError;
        if (!data?.analysis) throw new Error("Invalid response from analysis service");

        setAnalysis(data.analysis);
        setRetryCount(0);
        setError(null);
        toast.success("Analysis completed successfully");
      } catch (error) {
        console.error('Analysis error:', error);
        
        if (currentRetry < MAX_RETRIES - 1) {
          currentRetry++;
          const delay = RETRY_DELAY * Math.pow(2, currentRetry - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptAnalysis();
        }
        
        const errorMessage = error instanceof Error 
          ? error.message.includes('Failed to fetch')
            ? "Unable to connect to the analysis service. Please check your connection and try again."
            : `Analysis failed: ${error.message}`
          : "Failed to analyze RFP document. Please try again.";
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsAnalyzing(false);
      }
    };

    await attemptAnalysis();
  };

  const parsedSections = analysis ? parseAnalysis(analysis) : [];

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
          <div className="space-y-6">
            {parsedSections.map((section, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-lg">
                  {section.icon}
                  {section.title}
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-6">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
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