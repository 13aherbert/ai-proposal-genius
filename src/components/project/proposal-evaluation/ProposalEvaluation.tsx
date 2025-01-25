import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProposalEvaluation } from "./useProposalEvaluation";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface ProposalEvaluationProps {
  projectId: string;
  analysis: string | null;
}

export function ProposalEvaluation({ projectId, analysis }: ProposalEvaluationProps) {
  const {
    evaluation,
    isEvaluating,
    error,
    handleEvaluate
  } = useProposalEvaluation(projectId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposal Evaluation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!evaluation && !isEvaluating && (
          <Button 
            onClick={handleEvaluate}
            className="w-full flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Evaluate Proposal
          </Button>
        )}

        {isEvaluating && (
          <Button 
            disabled
            className="w-full"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Evaluating...
          </Button>
        )}

        {evaluation && (
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <ReactMarkdown>{evaluation}</ReactMarkdown>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}