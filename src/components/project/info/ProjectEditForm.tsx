import { useState } from "react";
import { format } from "date-fns";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Project } from "@/hooks/use-project-details";

interface ProjectEditFormProps {
  project: Project;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProjectEditForm({ project, onCancel, onSuccess }: ProjectEditFormProps) {
  const [title, setTitle] = useState(project.title);
  const [clientName, setClientName] = useState(project.client_name || "");
  const [businessName, setBusinessName] = useState(project.business_name || "");
  const [deadline, setDeadline] = useState<Date | undefined>(
    project.deadline ? new Date(project.deadline) : undefined
  );
  const queryClient = useQueryClient();

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

      await queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      toast.success("Project details updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project details");
    }
  };

  return (
    <div className="space-y-4">
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
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
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
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}