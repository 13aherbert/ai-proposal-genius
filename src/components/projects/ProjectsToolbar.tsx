
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ProjectsHeader } from "@/components/projects/ProjectsHeader";
import { useNavigate } from "react-router-dom";
import { UpgradeGateModal } from "@/components/subscription/UpgradeGateModal";

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
      <UpgradeGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        currentLimit={displayProjectLimit}
      />
    </>
  );
}
