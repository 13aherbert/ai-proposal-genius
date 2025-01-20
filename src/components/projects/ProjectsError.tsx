import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

type ProjectsErrorProps = {
  onRetry: () => void;
};

export function ProjectsError({ onRetry }: ProjectsErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load projects. Please check your connection and try again.</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRetry}
          className="ml-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}