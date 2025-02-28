
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, description, className, ...props }, ref) => {
    const id = props.id || props.name;
    
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <Label 
            htmlFor={id}
            className={error ? "text-destructive" : ""}
          >
            {label}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          />
          {error && (
            <AlertCircle className="h-4 w-4 text-destructive absolute right-3 top-1/2 transform -translate-y-1/2" />
          )}
        </div>
        {error && (
          <p 
            id={`${id}-error`}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
