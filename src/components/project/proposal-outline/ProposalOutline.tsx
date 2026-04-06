
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIProgress } from "@/components/shared/AIProgress";
import { useProposalOutline } from "./useProposalOutline";
import { EditableOutline } from "./EditableOutline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  // Track user edits to outline — starts as AI outline, user can modify
  const [editedOutline, setEditedOutline] = useState<string | null>(null);

  // When AI generates a new outline, reset edited version
  const currentOutline = editedOutline ?? outline;

  const handleOutlineChange = useCallback((markdown: string) => {
    setEditedOutline(markdown);
  }, []);

  const handleResetOutline = () => {
    handleReset();
    setEditedOutline(null);
  };

  // When a new outline is generated, clear edits
  const handleGenerate = async () => {
    setEditedOutline(null);
    await handleGenerateOutline();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-start">
          <CardTitle className="text-xl sm:text-2xl font-semibold leading-none tracking-tight">
            Proposal Outline
          </CardTitle>
          <CardDescription>
            Generate an AI-powered outline, then reorder, edit, or add sections before content generation
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
            onClick={handleGenerate} 
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white"
            disabled={!analysis}
          >
            {!analysis ? "Analyze RFP first" : "Generate Proposal Outline"}
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
        
        {outline && !isGenerating && (
          <div className="space-y-4">
            <EditableOutline
              outlineMarkdown={currentOutline || outline}
              onOutlineChange={handleOutlineChange}
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-destructive hover:bg-destructive/10 text-destructive w-full sm:w-auto"
                  >
                    Reset Outline
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the current outline. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetOutline}>
                      Yes, reset outline
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="outline" 
                onClick={handleGenerate}
                size="sm"
                className="bg-brand-green hover:bg-brand-green-dark text-white border-brand-green hover:border-brand-green-dark w-full sm:w-auto"
                disabled={isGenerating}
              >
                Generate New Outline
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
