import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProposalEvaluation } from "./useProposalEvaluation";
import { Separator } from "@/components/ui/separator";
import { EvaluationProgress } from "./components/EvaluationProgress";
import { EvaluationContent } from "./components/EvaluationContent";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface ProposalEvaluationProps {
  projectId: string;
  analysis: string | null;
}

export function ProposalEvaluation({ projectId, analysis }: ProposalEvaluationProps) {
  const {
    evaluation,
    isEvaluating,
    error,
    progress,
    handleEvaluate
  } = useProposalEvaluation(projectId);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="bg-white shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 w-full">
              <div className="flex flex-col items-start text-left">
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
                  Proposal Evaluation
                </CardTitle>
                <CardDescription>
                  Get an AI-powered evaluation of your proposal
                </CardDescription>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <Button 
              onClick={handleEvaluate}
              disabled={isEvaluating}
              variant={evaluation ? "outline" : "default"}
              className="flex items-center gap-2 min-w-[140px]"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  {evaluation ? "Reevaluate" : "Evaluate"}
                </>
              )}
            </Button>
          </div>
          <Separator />
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isEvaluating && <EvaluationProgress progress={progress} />}

            {evaluation ? (
              <EvaluationContent content={evaluation} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Click the evaluate button to get an AI-powered analysis of your proposal.
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}