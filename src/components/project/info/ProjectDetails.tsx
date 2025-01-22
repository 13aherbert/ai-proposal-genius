import { format } from "date-fns";
import { Calendar, FileText, User, Building } from "lucide-react";
import type { Project } from "@/hooks/use-project-details";

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Title: {project.title}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Status: {project.status}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Client: {project.client_name || "Not specified"}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building className="h-4 w-4" />
          <span>Business: {project.business_name || "Not specified"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created: {format(new Date(project.created_at), "PPP")}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Due Date: {project.deadline ? format(new Date(project.deadline), "PPP") : "Not specified"}</span>
        </div>
      </div>
    </div>
  );
}