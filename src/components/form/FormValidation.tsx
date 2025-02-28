
import React, { useState, useEffect, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Validation types
export type ValidationRule = {
  validator: (value: string) => boolean;
  message: string;
};

export type ValidationRules = {
  [key: string]: ValidationRule[];
};

// Common validation rules that can be reused
export const ValidationRules = {
  required: {
    validator: (value: string) => value.trim().length > 0,
    message: "This field is required"
  },
  email: {
    validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Please enter a valid email address"
  },
  minLength: (length: number) => ({
    validator: (value: string) => value.length >= length,
    message: `Must be at least ${length} characters`
  }),
  maxLength: (length: number) => ({
    validator: (value: string) => value.length <= length,
    message: `Cannot exceed ${length} characters`
  }),
  numeric: {
    validator: (value: string) => /^\d+$/.test(value),
    message: "Must contain only numbers"
  },
  alphanumeric: {
    validator: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message: "Must contain only letters and numbers"
  },
  phone: {
    validator: (value: string) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value),
    message: "Please enter a valid phone number"
  },
  password: {
    validator: (value: string) => 
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
    message: "Password must contain at least 8 characters, including uppercase, lowercase, number and special character"
  },
  url: {
    validator: (value: string) => 
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(value),
    message: "Please enter a valid URL"
  },
  date: {
    validator: (value: string) => !isNaN(Date.parse(value)),
    message: "Please enter a valid date"
  },
  fileSize: (maxSizeMB: number) => ({
    validator: (file: any) => {
      if (!file || typeof file !== 'object' || !file.size) return true;
      return file.size <= maxSizeMB * 1024 * 1024;
    },
    message: `File size must be less than ${maxSizeMB}MB`
  }),
  fileType: (allowedTypes: string[]) => ({
    validator: (file: any) => {
      if (!file || typeof file !== 'object' || !file.type) return true;
      return allowedTypes.includes(file.type);
    },
    message: `File must be one of the following types: ${allowedTypes.join(', ')}`
  }),
};

// Base components with validation
interface ValidatedFieldProps {
  id: string;
  label?: string;
  rules?: ValidationRule[];
  className?: string;
  showValidationIcon?: boolean;
  onValidation?: (isValid: boolean) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

// ValidatedInput component
interface ValidatedInputProps extends Omit<ValidatedFieldProps, 'value' | 'onChange'>, Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  value,
  onChange,
  rules = [],
  className,
  showValidationIcon = true,
  onValidation,
  validateOnChange = true,
  validateOnBlur = true,
  ...props
}) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if ((touched && validateOnBlur) || (value !== '' && validateOnChange)) {
      validateInput();
    }
  }, [value, touched]);

  const validateInput = () => {
    for (const rule of rules) {
      if (!rule.validator(value)) {
        setError(rule.message);
        setValidated(false);
        if (onValidation) onValidation(false);
        return;
      }
    }
    setError(null);
    setValidated(true);
    if (onValidation) onValidation(true);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      validateInput();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (validateOnChange && touched) {
      validateInput();
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            error ? "border-destructive pr-10" : 
            validated && showValidationIcon ? "border-green-500 pr-10" : "",
            className
          )}
          {...props}
        />
        {showValidationIcon && (
          <>
            {error && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
            {validated && !error && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

// ValidatedTextarea component
interface ValidatedTextareaProps extends Omit<ValidatedFieldProps, 'value' | 'onChange'>, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  rules = [],
  className,
  showValidationIcon = true,
  onValidation,
  validateOnChange = true,
  validateOnBlur = true,
  ...props
}) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if ((touched && validateOnBlur) || (value !== '' && validateOnChange)) {
      validateTextarea();
    }
  }, [value, touched]);

  const validateTextarea = () => {
    for (const rule of rules) {
      if (!rule.validator(value)) {
        setError(rule.message);
        setValidated(false);
        if (onValidation) onValidation(false);
        return;
      }
    }
    setError(null);
    setValidated(true);
    if (onValidation) onValidation(true);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      validateTextarea();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    if (validateOnChange && touched) {
      validateTextarea();
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Textarea
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            error ? "border-destructive" : 
            validated && showValidationIcon ? "border-green-500" : "",
            className
          )}
          {...props}
        />
        {showValidationIcon && (
          <>
            {error && (
              <div className="absolute right-3 top-3 text-destructive">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
            {validated && !error && (
              <div className="absolute right-3 top-3 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

// FormValidationGroup component for managing form-level validation
export interface FormField {
  id: string;
  value: string;
  rules: ValidationRule[];
  isValid?: boolean;
}

interface FormValidationGroupProps {
  fields: FormField[];
  onValidation?: (isValid: boolean, validFields: string[]) => void;
  children: React.ReactNode;
}

export const FormValidationGroup: React.FC<FormValidationGroupProps> = ({
  fields,
  onValidation,
  children
}) => {
  const [fieldStatus, setFieldStatus] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Initialize field status
    const initialStatus: Record<string, boolean> = {};
    fields.forEach(field => {
      initialStatus[field.id] = field.isValid || false;
    });
    setFieldStatus(initialStatus);
  }, []);

  useEffect(() => {
    if (Object.keys(fieldStatus).length) {
      const isFormValid = Object.values(fieldStatus).every(Boolean) && 
                          Object.keys(fieldStatus).length === fields.length;
      const validFields = Object.entries(fieldStatus)
        .filter(([_, isValid]) => isValid)
        .map(([id]) => id);
      
      if (onValidation) {
        onValidation(isFormValid, validFields);
      }
    }
  }, [fieldStatus, fields]);

  const handleFieldValidation = (id: string, isValid: boolean) => {
    setFieldStatus(prev => ({
      ...prev,
      [id]: isValid
    }));
  };

  // We need to modify how we add props to children
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const fieldId = child.props.id;
      if (fieldId && fields.some(f => f.id === fieldId)) {
        // Clone with a properly typed onValidation prop
        return React.cloneElement(child, {
          onValidation: (isValid: boolean) => handleFieldValidation(fieldId, isValid)
        } as any);
      }
    }
    return child;
  });

  return <>{childrenWithProps}</>;
};
