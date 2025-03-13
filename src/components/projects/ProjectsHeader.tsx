
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Update the interface to include the isSubscriptionLoading prop
interface ProjectsHeaderProps {
  canCreateProject?: boolean;
  currentPlanLimit?: number;
  projectCount?: number;
  isSubscriptionLoading?: boolean;
}

export function ProjectsHeader({ 
  canCreateProject = true,
  currentPlanLimit,
  projectCount,
  isSubscriptionLoading = false
}: ProjectsHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        
        {/* Display project count and limit when available */}
        {currentPlanLimit && typeof projectCount === 'number' && !isSubscriptionLoading && (
          <div className="ml-2 text-sm text-muted-foreground">
            {projectCount} of {currentPlanLimit} projects
          </div>
        )}
        
        {isSubscriptionLoading && (
          <div className="ml-2 text-sm text-muted-foreground">
            Loading project usage...
          </div>
        )}
      </div>
      <Button 
        onClick={() => navigate("/upload-rfp")}
        className="bg-brand-green hover:bg-brand-green-dark"
        disabled={!canCreateProject}
      >
        New Project
      </Button>
    </header>
  );
}
