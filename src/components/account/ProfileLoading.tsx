
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  
  useEffect(() => {
    if (fetchError && retryCount < 2 && !isAutoRetrying) {
      setIsAutoRetrying(true);
      const timer = setTimeout(() => {
        handleRetryFetch();
        setRetryCount(prev => prev + 1);
        setIsAutoRetrying(false);
      }, 3000); // Auto-retry after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [fetchError, retryCount, handleRetryFetch, isAutoRetrying]);

  if (fetchError) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="font-medium">Failed to load profile data</span>
        </div>
        <p className="text-sm text-muted-foreground">{fetchError}</p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="self-start"
            onClick={handleRetryFetch}
            disabled={isFetching || isAutoRetrying}
          >
            {isFetching || isAutoRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {isAutoRetrying ? "Auto-retrying..." : "Retrying..."}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </>
            )}
          </Button>
          
          {isAutoRetrying && (
            <span className="text-xs text-muted-foreground">
              Auto-retrying in a few seconds...
            </span>
          )}
        </div>
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
