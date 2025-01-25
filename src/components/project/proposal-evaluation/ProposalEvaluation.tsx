import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/**
 * ProposalEvaluation Component
 * 
 * Manages the AI-powered evaluation of proposals, including:
 * - Triggering the evaluation process
 * - Displaying progress during evaluation
 * - Showing evaluation results in a formatted view
 * - Handling error states
 * - Collapsible interface for better space management
 * 
 * @param projectId - The ID of the project being evaluated
 * @param analysis - The existing analysis text (currently unused, maintained for future use)
 */
export function ProposalEvaluation({ projectId, analysis }: ProposalEvaluationProps) {
  const {
    evaluation,
    isEvaluating,
    error,
    progress,
    handleEvaluate
  } = useProposalEvaluation(projectId);

  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="bg-white shadow-md">
      <CollapsibleTrigger
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
      >
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-semibold text-gray-800">
                Proposal Evaluation
              </CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleEvaluate();
              }}
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
          <p className="text-sm text-muted-foreground">
            Get an AI-powered evaluation of your proposal's strengths and areas for improvement.
          </p>
          <Separator />
        </CardHeader>
      </CollapsibleTrigger>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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