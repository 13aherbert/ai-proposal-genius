
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ValidatedInput, ValidationRules, FormValidationGroup } from "@/components/form/FormValidation";
import { debounce } from "lodash";

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
  isProcessing?: boolean;
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
  isProcessing = false,
}: ProjectFormProps) {
  const [isTitleValid, setIsTitleValid] = useState(false);
  
  // Use useMemo instead of recreating the array on every render
  const formFields = useMemo(() => [
    { id: 'project-title', value: projectTitle, rules: [ValidationRules.required, ValidationRules.maxLength(100)], isValid: isTitleValid },
    { id: 'client-name', value: clientName, rules: [ValidationRules.maxLength(100)], isValid: true },
    { id: 'business-name', value: businessName, rules: [ValidationRules.maxLength(100)], isValid: true }
  ], [projectTitle, isTitleValid, clientName, businessName]);
  
  // Debounced validation handler to prevent excessive validation calls
  const handleFormValidation = useCallback(debounce((isValid: boolean, validFields: string[]) => {
    // Skip unnecessary validation logs
  }, 250), []);

  // Debounced handlers for text input changes
  const handleTitleChange = useCallback(debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectTitle(e.target.value);
  }, 100), [setProjectTitle]);

  const handleClientNameChange = useCallback(debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
  }, 100), [setClientName]);

  const handleBusinessNameChange = useCallback(debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setBusinessName(e.target.value);
  }, 100), [setBusinessName]);

  // Memoize the actual input change handlers to prevent recreating on each render
  const onTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    handleTitleChange(e);
  }, [handleTitleChange]);

  const onClientNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    handleClientNameChange(e);
  }, [handleClientNameChange]);

  const onBusinessNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    handleBusinessNameChange(e);
  }, [handleBusinessNameChange]);

  return (
    <div className="space-y-6">
      <FormValidationGroup fields={formFields} onValidation={handleFormValidation}>
        <div className="space-y-4">
          <ValidatedInput
            id="project-title"
            label="Project Title *"
            value={projectTitle}
            onChange={onTitleChange}
            placeholder="Enter a descriptive title for your project"
            rules={[ValidationRules.required, ValidationRules.maxLength(100)]}
            onValidation={setIsTitleValid}
            validateOnChange={false}
            validateOnBlur={true}
            required
          />

          <div className="space-y-2">
            <label htmlFor="deadline" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Deadline (Optional)
            </label>
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
            onChange={onClientNameChange}
            placeholder="Enter the client or organization name"
            rules={[ValidationRules.maxLength(100)]}
            validateOnChange={false}
            validateOnBlur={true}
          />

          <ValidatedInput
            id="business-name"
            label="Your Business Name (Optional)"
            value={businessName}
            onChange={onBusinessNameChange}
            placeholder="Enter your business or organization name"
            rules={[ValidationRules.maxLength(100)]}
            validateOnChange={false}
            validateOnBlur={true}
          />
        </div>
      </FormValidationGroup>

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
