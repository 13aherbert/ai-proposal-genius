import { Progress } from "@/components/ui/progress";

interface EvaluationProgressProps {
  progress: number;
}

/**
 * Displays the current progress of the proposal evaluation
 * Shows both a progress bar and percentage text
 */
export function EvaluationProgress({ progress }: EvaluationProgressProps) {
  const roundedProgress = Math.round(progress);

  return (
    <div className="space-y-2">
      <Progress value={roundedProgress} className="w-full h-2" />
      <p className="text-sm text-center text-muted-foreground">
        Analyzing proposal... {roundedProgress}%
      </p>
    </div>
  );
}