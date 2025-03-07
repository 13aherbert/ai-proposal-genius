
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectsHeaderProps {
  canCreateProject?: boolean;
}

export function ProjectsHeader({ canCreateProject = true }: ProjectsHeaderProps) {
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
