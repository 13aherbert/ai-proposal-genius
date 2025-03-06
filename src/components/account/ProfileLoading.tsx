
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileLoadingProps {
  isLoading: boolean;
  fetchError: string | null;
  handleRetryFetch: () => void;
  isFetching: boolean;
}

export function ProfileLoading({ 
  isLoading, 
  fetchError, 
  handleRetryFetch,
  isFetching
}: ProfileLoadingProps) {
  if (fetchError) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="font-medium">Failed to load profile data</span>
        </div>
        <p className="text-sm text-muted-foreground">{fetchError}</p>
        <Button 
          variant="outline" 
          className="self-start"
          onClick={handleRetryFetch}
          disabled={isFetching}
        >
          {isFetching ? "Retrying..." : "Retry"}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return null;
}
