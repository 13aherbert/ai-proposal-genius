
import { Loader2 } from "lucide-react";

export function ProjectsLoadingState({ message = "Loading projects..." }: { message?: string }) {
  return (
    <div className="flex justify-center items-center h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
