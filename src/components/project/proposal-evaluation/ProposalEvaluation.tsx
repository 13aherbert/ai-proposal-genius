import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useProposalEvaluation } from "./useProposalEvaluation";
import { Separator } from "@/components/ui/separator";
import { EvaluationProgress } from "./components/EvaluationProgress";
import { EvaluationContent } from "./components/EvaluationContent";
import { ApplySuggestionsButton } from "./components/ApplySuggestionsButton";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import { PlanComparisonModal } from "@/components/subscription/PlanComparisonModal";

interface ProposalEvaluationProps {
  projectId: string;
  analysis: string | null;
  onSectionsUpdated?: () => void;
}

export function ProposalEvaluation({ projectId, analysis, onSectionsUpdated }: ProposalEvaluationProps) {
  const { hasFeature } = useSubscriptionFeatures();
  const hasEvaluation = hasFeature("evaluation");
  const [showUpgrade, setShowUpgrade] = useState(false);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col items-start flex-1">
            <CardTitle className="text-xl sm:text-2xl font-semibold leading-none tracking-tight text-foreground">
              Proposal Evaluation
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Get an AI-powered evaluation of your proposal
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {hasEvaluation ? (
              <Button 
                onClick={handleEvaluate}
                disabled={isEvaluating}
                variant="outline"
                className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark w-full sm:w-auto"
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
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowUpgrade(true)}
                className="w-full sm:w-auto gap-2"
              >
                <Lock className="h-4 w-4" />
                Evaluate
                <Badge variant="secondary" className="text-[10px] ml-1">Business</Badge>
              </Button>
            )}
            {evaluation && hasEvaluation && (
              <ApplySuggestionsButton
                projectId={projectId}
                evaluation={evaluation}
                onComplete={onSectionsUpdated}
              />
            )}
          </div>
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
            {hasEvaluation ? (
              "Click the evaluate button to get an AI-powered analysis of your proposal."
            ) : (
              <div className="space-y-2">
                <p>AI Proposal Evaluation is available on Business and Enterprise plans.</p>
                <Button size="sm" variant="outline" onClick={() => setShowUpgrade(true)}>
                  Upgrade to Business — $499/month
                </Button>
                <p className="text-xs">14-day free trial · Cancel anytime</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <PlanComparisonModal open={showUpgrade} onOpenChange={setShowUpgrade} highlightPlan="business" />
    </Card>
  );
}
