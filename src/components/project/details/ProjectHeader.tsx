import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  title: string;
}

/**
 * Header component for the project details page
 * Displays the project title and a back button to navigate to recent projects
 */
export function ProjectHeader({ title }: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/recent-projects")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-3xl font-bold">{title}</h1>
    </header>
  );
}