
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

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
  if (!isLoading && !fetchError) {
    return null;
  }

  return (
    <>
      {isLoading && (
        <Card className="p-6 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-sm text-muted-foreground">
              Loading your profile data...
            </p>
          </div>
        </Card>
      )}

      {fetchError && (
        <Card className="p-6 border-destructive">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-medium">Failed to Load Profile Data</h3>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {fetchError}
            </p>
            <Button 
              variant="outline"
              onClick={handleRetryFetch}
              disabled={isFetching}
              className="mt-2"
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
