import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIProgress } from "@/components/shared/AIProgress";
import { useProposalOutline } from "./useProposalOutline";
import ReactMarkdown from "react-markdown";

interface ProposalOutlineProps {
  projectId: string;
  analysis: string | null;
}

export function ProposalOutline({ projectId, analysis }: ProposalOutlineProps) {
  const {
    outline,
    isGenerating,
    error,
    progress,
    handleGenerateOutline,
    handleReset
  } = useProposalOutline(projectId, analysis);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start">
          <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
            Proposal Outline
          </CardTitle>
          <CardDescription>
            Generate an AI-powered outline for your proposal
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!outline && !isGenerating && (
          <Button 
            onClick={handleGenerateOutline} 
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white"
            disabled={!analysis}
          >
            Generate Proposal Outline
          </Button>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <Button 
              disabled
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
            <AIProgress progress={progress} label="Generating outline" />
          </div>
        )}
        
        {outline && (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{outline}</ReactMarkdown>
            </div>
            <Button 
              variant="outline" 
              onClick={handleReset}
              size="sm"
              className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark"
            >
              Generate New Outline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}