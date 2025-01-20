import { format } from "date-fns";
import { Calendar, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/hooks/use-project-details";

interface ProjectInfoProps {
  project: Project;
}

export function ProjectInfo({ project }: ProjectInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
        <CardDescription>Details about your RFP project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Status: {project.status}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created: {format(new Date(project.created_at), "PPP")}</span>
        </div>
      </CardContent>
    </Card>
  );
}