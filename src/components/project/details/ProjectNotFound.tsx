
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Not found state component for the project details page
 * Displays a not found message and a back button
 */
export function ProjectNotFound({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryFetch = async () => {
    if (!projectId) return;
    
    setIsRetrying(true);
    toast.loading("Retrying to load project...");
    
    try {
      // Invalidate the cache for this project and refetch
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      
      // Navigate to the same route to trigger a refetch
      navigate(0); // This is equivalent to a page refresh
    } catch (error) {
      console.error("Error retrying fetch:", error);
      toast.error("Failed to reload project");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Project not found</h1>
        </div>
        
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-muted rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">We couldn't find this project</h2>
            <p className="text-muted-foreground max-w-md">
              The project you're looking for might have been deleted, or you may not have permission to view it.
              {projectId && <span className="block mt-2 text-sm">Project ID: {projectId}</span>}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button 
                variant="outline" 
                onClick={() => navigate("/projects")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              
              <Button
                onClick={() => navigate("/dashboard")}
                variant="secondary"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              
              {projectId && (
                <Button 
                  onClick={handleRetryFetch} 
                  disabled={isRetrying}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
