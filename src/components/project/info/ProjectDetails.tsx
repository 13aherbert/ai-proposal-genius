import { format } from "date-fns";
import { Calendar, FileText, Building } from "lucide-react";
import type { Project } from "@/hooks/use-project-details";

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <dt className="text-muted-foreground">Title:</dt>
        <dd className="font-medium truncate">{project.title}</dd>
      </div>
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <dt className="text-muted-foreground">Business:</dt>
        <dd className="font-medium truncate">{project.business_name || "—"}</dd>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <dt className="text-muted-foreground">Created:</dt>
        <dd className="font-medium">{format(new Date(project.created_at), "PP")}</dd>
      </div>
    </dl>
  );
}
