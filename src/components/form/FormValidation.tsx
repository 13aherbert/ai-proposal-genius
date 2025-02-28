
import { ReactNode, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface ValidatedInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  validationRules?: ValidationRule[];
  onValidationChange?: (isValid: boolean) => void;
}

export const ValidatedInput = ({
  id,
  name,
  value,
  onChange,
  label,
  placeholder,
  type = "text",
  required = false,
  className,
  disabled = false,
  autoComplete,
  minLength,
  maxLength,
  pattern,
  validationRules = [],
  onValidationChange,
}: ValidatedInputProps) => {
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (val: string) => {
    const newErrors: string[] = [];

    if (required && !val) {
      newErrors.push("This field is required");
    }

    if (minLength && val.length < minLength) {
      newErrors.push(`Minimum length is ${minLength} characters`);
    }

    if (maxLength && val.length > maxLength) {
      newErrors.push(`Maximum length is ${maxLength} characters`);
    }

    if (pattern && val && !new RegExp(pattern).test(val)) {
      newErrors.push("Invalid format");
    }

    validationRules.forEach((rule) => {
      if (!rule.test(val)) {
        newErrors.push(rule.message);
      }
    });

    setErrors(newErrors);
    if (onValidationChange) {
      onValidationChange(newErrors.length === 0);
    }
    return newErrors.length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (touched) {
      validate(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validate(value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          errors.length > 0 && touched ? "border-destructive" : "",
          className
        )}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        aria-invalid={errors.length > 0 && touched}
        aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
      />
      {touched && errors.length > 0 && (
        <div id={`${id}-error`} className="text-destructive text-sm">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ValidatedTextareaProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  validationRules?: ValidationRule[];
  onValidationChange?: (isValid: boolean) => void;
  rows?: number;
}

export const ValidatedTextarea = ({
  id,
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  className,
  disabled = false,
  minLength,
  maxLength,
  validationRules = [],
  onValidationChange,
  rows,
}: ValidatedTextareaProps) => {
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (val: string) => {
    const newErrors: string[] = [];

    if (required && !val) {
      newErrors.push("This field is required");
    }

    if (minLength && val.length < minLength) {
      newErrors.push(`Minimum length is ${minLength} characters`);
    }

    if (maxLength && val.length > maxLength) {
      newErrors.push(`Maximum length is ${maxLength} characters`);
    }

    validationRules.forEach((rule) => {
      if (!rule.test(val)) {
        newErrors.push(rule.message);
      }
    });

    setErrors(newErrors);
    if (onValidationChange) {
      onValidationChange(newErrors.length === 0);
    }
    return newErrors.length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (touched) {
      validate(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validate(value);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <Textarea
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          errors.length > 0 && touched ? "border-destructive" : "",
          className
        )}
        required={required}
        disabled={disabled}
        minLength={minLength}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={errors.length > 0 && touched}
        aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
      />
      {touched && errors.length > 0 && (
        <div id={`${id}-error`} className="text-destructive text-sm">
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface FormValidationContextProps {
  children: ReactNode;
  onValidationChange?: (isValid: boolean) => void;
}

export const FormValidationGroup = ({
  children,
  onValidationChange,
}: FormValidationContextProps) => {
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});

  const handleFieldValidationChange = (fieldId: string, isValid: boolean) => {
    setValidationState((prev) => {
      const newState = { ...prev, [fieldId]: isValid };
      
      // Check if all fields are valid
      const allValid = Object.values(newState).every(Boolean);
      
      if (onValidationChange) {
        onValidationChange(allValid);
      }
      
      return newState;
    });
  };

  return (
    <div className="space-y-4">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onValidationChange: (isValid: boolean) =>
              handleFieldValidationChange(child.props.id, isValid),
          });
        }
        return child;
      })}
    </div>
  );
};

// Common validation rules that can be reused across the application
export const ValidationRules = {
  email: {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: "Please enter a valid email address",
  },
  password: {
    test: (value: string) => 
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value),
    message: 
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
  },
  url: {
    test: (value: string) => 
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value),
    message: "Please enter a valid URL",
  },
  phone: {
    test: (value: string) => 
      /^(\+\d{1,3}[- ]?)?\d{10,14}$/.test(value),
    message: "Please enter a valid phone number",
  },
  numeric: {
    test: (value: string) => /^\d+$/.test(value),
    message: "Please enter numbers only",
  },
  alphanumeric: {
    test: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message: "Please enter letters and numbers only",
  },
};
