import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { SaveStatus } from "@/hooks/use-auto-save";

interface GlobalSaveStatusProps {
  sectionStatuses: SaveStatus[];
}

export function GlobalSaveStatus({ sectionStatuses }: GlobalSaveStatusProps) {
  const savingCount = sectionStatuses.filter(s => s === "saving").length;
  const failedCount = sectionStatuses.filter(s => s === "failed").length;
  const unsavedCount = sectionStatuses.filter(s => s === "unsaved").length;

  if (savingCount > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }

  if (failedCount > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        {failedCount} section{failedCount > 1 ? "s" : ""} failed to save
      </span>
    );
  }

  if (unsavedCount > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <Loader2 className="h-3.5 w-3.5" />
        {unsavedCount} unsaved change{unsavedCount > 1 ? "s" : ""}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-green-600">
      <CheckCircle className="h-3.5 w-3.5" />
      All changes saved
    </span>
  );
}
