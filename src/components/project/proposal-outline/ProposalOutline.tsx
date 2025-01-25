import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIProgress } from "@/components/shared/AIProgress";
import { useProposalOutline } from "./useProposalOutline";
import ReactMarkdown from "react-markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2">
              <div>
                <CardTitle>Proposal Outline</CardTitle>
                <CardDescription>AI-generated structure for your proposal</CardDescription>
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
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{outline}</ReactMarkdown>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  size="sm"
                >
                  Generate New Outline
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}