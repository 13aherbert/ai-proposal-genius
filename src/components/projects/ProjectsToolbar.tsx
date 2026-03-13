
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { useNavigate } from "react-router-dom";
import { PlanComparisonModal } from "@/components/subscription/PlanComparisonModal";

interface ProjectsToolbarProps {
  canCreateProject: boolean;
  displayProjectLimit: number;
  projectCount?: number;
  isSubscriptionLoading: boolean;
  onRefresh: () => void;
}

export function ProjectsToolbar({
  canCreateProject,
  displayProjectLimit,
  projectCount,
  isSubscriptionLoading,
  onRefresh
}: ProjectsToolbarProps) {
  const navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(false);
  
  const handleNewProject = () => {
    if (canCreateProject) {
      navigate("/upload-rfp");
    } else {
      setGateOpen(true);
    }
  };

  return (
    <>
      <div className="flex justify-between items-start">
        <ProjectsHeader 
          canCreateProject={canCreateProject} 
          currentPlanLimit={displayProjectLimit} 
          projectCount={projectCount}
          isSubscriptionLoading={isSubscriptionLoading}
        />
        <div className="flex items-center gap-3">
          {projectCount !== undefined && projectCount === displayProjectLimit - 1 && (
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
              1 slot left
            </span>
          )}
          <Button 
            onClick={handleNewProject}
            className="bg-brand-green hover:bg-brand-green-dark"
          >
            New Project
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <PlanComparisonModal
        open={gateOpen}
        onOpenChange={setGateOpen}
      />
    </>
  );
}
