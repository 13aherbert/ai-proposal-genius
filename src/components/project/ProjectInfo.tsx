import { format } from "date-fns";
import { Calendar, FileText, User, Building, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { Project } from "@/hooks/use-project-details";

interface ProjectInfoProps {
  project: Project;
}

export function ProjectInfo({ project }: ProjectInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [clientName, setClientName] = useState(project.client_name || "");
  const [businessName, setBusinessName] = useState(project.business_name || "");
  const [deadline, setDeadline] = useState<Date | undefined>(
    project.deadline ? new Date(project.deadline) : undefined
  );

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title,
          client_name: clientName || null,
          business_name: businessName || null,
          deadline: deadline?.toISOString() || null,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Project details updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project details");
    }
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Project Information</CardTitle>
          <CardDescription>Update your RFP project details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Client Name</label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Business Name</label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Details about your RFP project</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            Edit Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}