
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
  // Don't show anything if not loading and no error
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
              Loading your profile...
            </p>
          </div>
        </Card>
      )}

      {fetchError && (
        <Card className="p-6 border-amber-200 bg-amber-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-medium">Having trouble loading your profile</h3>
            </div>
            <p className="text-center text-sm text-amber-600">
              {fetchError.includes('network') || fetchError.includes('connection') 
                ? "We're having trouble connecting. Your cached data is being used if available."
                : fetchError
              }
            </p>
            <Button 
              variant="outline"
              onClick={handleRetryFetch}
              disabled={isFetching}
              className="mt-2 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
