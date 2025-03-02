
import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-brand-green mb-4" />
      <p className="text-muted-foreground">Loading your subscription...</p>
    </div>
  );
}
