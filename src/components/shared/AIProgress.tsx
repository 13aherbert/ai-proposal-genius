import { Progress } from "@/components/ui/progress";

interface AIProgressProps {
  progress: number;
  label?: string;
}

/**
 * Shared progress indicator for AI operations
 * Shows both a progress bar and percentage text
 */
export function AIProgress({ progress, label }: AIProgressProps) {
  const roundedProgress = Math.round(progress);

  return (
    <div className="space-y-2">
      <Progress value={roundedProgress} className="w-full h-2" />
      <p className="text-sm text-center text-muted-foreground">
        {label || "Processing"} ... {roundedProgress}%
      </p>
    </div>
  );
}