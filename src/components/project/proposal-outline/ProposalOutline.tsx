import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIProgress } from "@/components/shared/AIProgress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
        <CardTitle>Proposal Outline</CardTitle>
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
            className="w-full"
            disabled={!analysis}
          >
            Generate Proposal Outline
          </Button>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <Button 
              disabled
              className="w-full"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
            <AIProgress progress={progress} label="Generating outline" />
          </div>
        )}
        
        {outline && (
          <Accordion type="single" collapsible>
            <AccordionItem value="outline">
              <AccordionTrigger>Outline Results</AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{outline}</ReactMarkdown>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    size="sm"
                  >
                    Generate New Outline
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}