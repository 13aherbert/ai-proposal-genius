
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidatedInput, ValidationRules } from "@/components/form/FormValidation";

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
}

export function ProjectForm({
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
}: ProjectFormProps) {
  const [isTitleValid, setIsTitleValid] = useState(false);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectTitle(e.target.value);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
  };

  const handleBusinessNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessName(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ValidatedInput
          id="project-title"
          label="Project Title *"
          value={projectTitle}
          onChange={handleTitleChange}
          placeholder="Enter a descriptive title for your project"
          rules={[ValidationRules.required, ValidationRules.maxLength(100)]}
          onValidation={setIsTitleValid}
          required
        />

        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="deadline"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP") : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={deadline}
                onSelect={setDeadline}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <ValidatedInput
          id="client-name"
          label="Client Name (Optional)"
          value={clientName}
          onChange={handleClientNameChange}
          placeholder="Enter the client or organization name"
          rules={[ValidationRules.maxLength(100)]}
        />

        <ValidatedInput
          id="business-name"
          label="Your Business Name (Optional)"
          value={businessName}
          onChange={handleBusinessNameChange}
          placeholder="Enter your business or organization name"
          rules={[ValidationRules.maxLength(100)]}
        />
      </div>

      <Button 
        onClick={onSubmit} 
        className="w-full" 
        disabled={isProcessing || !isTitleValid}
      >
        {isProcessing ? "Saving..." : "Save Project Details"}
      </Button>
    </div>
  );
}
