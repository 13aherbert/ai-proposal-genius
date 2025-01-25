import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProposalEvaluation } from "./useProposalEvaluation";
import { Separator } from "@/components/ui/separator";
import { EvaluationProgress } from "./components/EvaluationProgress";
import { EvaluationContent } from "./components/EvaluationContent";

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

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Proposal Evaluation
          </CardTitle>
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
        <p className="text-sm text-muted-foreground">
          Get an AI-powered evaluation of your proposal's strengths and areas for improvement.
        </p>
        <Separator />
      </CardHeader>
      
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
    </Card>
  );
}