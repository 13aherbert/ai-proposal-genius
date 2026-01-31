import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useApplySuggestions } from "../hooks/useApplySuggestions";

interface ApplySuggestionsButtonProps {
  projectId: string;
  evaluation: string;
  onComplete?: () => void;
}

export function ApplySuggestionsButton({ 
  projectId, 
  evaluation, 
  onComplete 
}: ApplySuggestionsButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { 
    progress, 
    improvementSummary, 
    applySuggestions 
  } = useApplySuggestions({ 
    projectId, 
    evaluation, 
    onComplete: () => {
      onComplete?.();
      // Keep dialog open briefly to show completion
      setTimeout(() => setIsDialogOpen(false), 2000);
    }
  });

  const handleApply = async () => {
    await applySuggestions();
  };

  const progressPercent = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 hover:border-primary/50"
          disabled={progress.isImproving}
        >
          {progress.isImproving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Applying...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Suggestions
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Apply Evaluation Suggestions
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {!progress.isImproving && progress.completed === 0 && (
                <>
                  <p>
                    This will use the AI evaluation feedback to automatically improve your proposal sections. 
                    The AI will rewrite each section addressing the specific suggestions.
                  </p>
                  
                  {improvementSummary.length > 0 && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-2">Key improvements to apply:</p>
                      <ul className="text-sm space-y-1">
                        {improvementSummary.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span className="text-muted-foreground">{item.substring(0, 100)}...</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    This process typically takes 30-60 seconds depending on the number of sections.
                  </p>
                </>
              )}

              {progress.isImproving && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm">{progress.currentSection || 'Processing...'}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {progress.completed} of {progress.total} sections improved
                  </p>
                </div>
              )}

              {!progress.isImproving && progress.completed > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Improvements Applied!</span>
                  </div>
                  
                  {progress.successes.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Improved sections:</p>
                      <ul className="space-y-1">
                        {progress.successes.map((section, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <Check className="h-3 w-3 text-green-600" />
                            {section}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {progress.errors.length > 0 && (
                    <div className="text-sm">
                      <p className="font-medium mb-1 text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Some sections failed:
                      </p>
                      <ul className="space-y-1">
                        {progress.errors.map((error, i) => (
                          <li key={i} className="text-muted-foreground text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!progress.isImproving && progress.completed === 0 && (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApply} className="bg-primary hover:bg-primary/90">
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Suggestions
              </AlertDialogAction>
            </>
          )}
          {progress.isImproving && (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          )}
          {!progress.isImproving && progress.completed > 0 && (
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>
              Done
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
