import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectFormProps {
  projectId: string | null;
  projectTitle: string;
  deadline?: Date;
  onTitleChange: (title: string) => void;
  onDeadlineChange: (date?: Date) => void;
  onSubmit: () => void;
}

export const ProjectForm = ({
  projectId,
  projectTitle,
  deadline,
  onTitleChange,
  onDeadlineChange,
  onSubmit,
}: ProjectFormProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
      </CardHeader>
      <CardContent>
        {projectId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">Project Title</Label>
              <Input
                id="projectTitle"
                value={projectTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter project title"
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
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
                    onSelect={onDeadlineChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={onSubmit}>Update Project</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Upload an RFP document to begin. Once uploaded, you'll be able to
              enter project details and start the AI analysis.
            </p>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
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
                    onSelect={onDeadlineChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};