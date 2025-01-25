import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProposalEvaluation } from "./useProposalEvaluation";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { Separator } from "@/components/ui/separator";

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

        {evaluation ? (
          <ScrollArea className="h-[500px] w-full rounded-md border bg-gray-50 p-6">
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-800">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mb-2 mt-4 text-gray-700">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-gray-600">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-600">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-800">{children}</strong>
                  ),
                }}
              >
                {evaluation}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Click the evaluate button to get an AI-powered analysis of your proposal.
          </div>
        )}
      </CardContent>
    </Card>
  );
}