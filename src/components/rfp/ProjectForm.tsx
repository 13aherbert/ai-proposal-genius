
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ClipboardEdit, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectFormProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  deadline: Date | undefined;
  setDeadline: (date: Date | undefined) => void;
  clientName: string;
  setClientName: (name: string) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  autoGenerate?: boolean;
  setAutoGenerate?: (value: boolean) => void;
}

export const ProjectForm = ({
  projectTitle,
  setProjectTitle,
  deadline,
  setDeadline,
  clientName,
  setClientName,
  businessName,
  setBusinessName,
  onSubmit,
  isProcessing,
  disabled = false,
  autoGenerate,
  setAutoGenerate
}: ProjectFormProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Card className="w-full max-w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardEdit className="h-5 w-5" />
          Project Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Enter a title for your project"
              disabled={disabled || isProcessing}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                  disabled={disabled || isProcessing}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align={isMobile ? "center" : "start"}>
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(date) => {
                    setDeadline(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name (Optional)</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              disabled={disabled || isProcessing}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name (Optional)</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              disabled={disabled || isProcessing}
              className="w-full"
            />
          </div>

          {/* Auto-Generate Toggle */}
          {setAutoGenerate && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="space-y-0.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label 
                          htmlFor="auto-generate" 
                          className="text-sm font-medium cursor-pointer"
                        >
                          Auto-generate proposal
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Automatically analyze RFP and generate a complete proposal using AI. This will run through all steps automatically after upload.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-xs text-muted-foreground">
                    Run full automation after upload
                  </p>
                </div>
              </div>
              <Switch
                id="auto-generate"
                checked={autoGenerate}
                onCheckedChange={setAutoGenerate}
                disabled={disabled || isProcessing}
              />
            </div>
          )}

          <Button 
            type="submit"
            className="w-full mt-4" 
            disabled={disabled || isProcessing || !projectTitle.trim()}
          >
            {isProcessing ? "Processing..." : projectTitle ? "Update Project" : "Create Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
