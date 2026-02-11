
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  title: string;
}

/**
 * Header component for the project details page
 * 
 * Responsible for:
 * 1. Displaying the project title
 * 2. Providing navigation back to the projects list
 * 3. Maintaining consistent header styling
 * 
 * @param title - The title of the project to display
 */
export function ProjectHeader({ title }: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-2 sm:gap-4 px-2 sm:px-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/projects")}
        aria-label="Back to projects"
        className="shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-xl sm:text-3xl font-bold truncate">{title}</h1>
    </header>
  );
}
