import { CheckCircle, Loader2, AlertTriangle, Circle } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";
import { cn } from "@/lib/utils";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry?: () => void;
  className?: string;
}

export function SaveStatusIndicator({ status, onRetry, className }: SaveStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div className={cn("flex items-center gap-1.5 text-xs transition-opacity duration-300", className)}>
      {status === "saved" && (
        <span className="flex items-center gap-1 text-green-600 animate-in fade-in">
          <CheckCircle className="h-3.5 w-3.5" />
          Saved
        </span>
      )}
      {status === "saving" && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </span>
      )}
      {status === "unsaved" && (
        <span className="flex items-center gap-1 text-amber-600">
          <Circle className="h-3 w-3 fill-amber-500" />
          Unsaved changes
        </span>
      )}
      {status === "failed" && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-destructive hover:underline cursor-pointer"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Save failed — retry
        </button>
      )}
    </div>
  );
}
