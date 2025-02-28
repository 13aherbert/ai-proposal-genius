
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ValidatedInput, FormValidationGroup, ValidationRules } from "@/components/form/FormValidation";

interface ProjectFormProps {
  projectId: string | null;
  projectTitle: string;
  clientName?: string;
  businessName?: string;
  deadline?: Date;
  onTitleChange: (title: string) => void;
  onClientNameChange: (name: string) => void;
  onBusinessNameChange: (name: string) => void;
  onDeadlineChange: (date?: Date) => void;
  onSubmit: () => void;
}

export const ProjectForm = ({
  projectId,
  projectTitle,
  clientName = "",
  businessName = "",
  deadline,
  onTitleChange,
  onClientNameChange,
  onBusinessNameChange,
  onDeadlineChange,
  onSubmit,
}: ProjectFormProps) => {
  const [isFormValid, setIsFormValid] = React.useState(false);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
      </CardHeader>
      <CardContent>
        {projectId ? (
          <FormValidationGroup onValidationChange={setIsFormValid}>
            <ValidatedInput
              id="projectTitle"
              value={projectTitle}
              onChange={onTitleChange}
              label="Project Title"
              placeholder="Enter project title"
              required={true}
              minLength={3}
              maxLength={100}
              validationRules={[
                {
                  test: (val) => val.trim().length > 0,
                  message: "Project title cannot be only whitespace"
                }
              ]}
            />
            
            <ValidatedInput
              id="clientName"
              value={clientName}
              onChange={onClientNameChange}
              label="Client Name"
              placeholder="Enter client name"
              maxLength={100}
            />
            
            <ValidatedInput
              id="businessName"
              value={businessName}
              onChange={onBusinessNameChange}
              label="Business Name"
              placeholder="Enter business name"
              maxLength={100}
            />
            
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
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <Button onClick={onSubmit} disabled={!isFormValid}>Update Project</Button>
          </FormValidationGroup>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Upload an RFP document to begin. Once uploaded, you'll be able to
              enter project details and start the AI analysis.
            </p>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
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
                    disabled={(date) => date < new Date()}
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
