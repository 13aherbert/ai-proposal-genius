import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProjectsHeader() {
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
        <h1 className="text-3xl font-bold">Recent Projects</h1>
      </div>
      <Button onClick={() => navigate("/upload-rfp")}>New Project</Button>
    </header>
  );
}