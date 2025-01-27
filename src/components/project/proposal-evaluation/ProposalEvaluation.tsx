import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export function ProposalEvaluation({ projectId, analysis }: ProposalEvaluationProps) {
  const {
    evaluation,
    isEvaluating,
    error,
    progress,
    handleEvaluate
  } = useProposalEvaluation(projectId);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start flex-1">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight text-foreground">
              Proposal Evaluation
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Get an AI-powered evaluation of your proposal
            </CardDescription>
          </div>
          <Button 
            onClick={handleEvaluate}
            disabled={isEvaluating}
            variant="outline"
            className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Evaluating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                {evaluation ? "Reevaluate" : "Evaluate"}
              </>
            )}
          </Button>
        </div>
        <Separator className="bg-border" />
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
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