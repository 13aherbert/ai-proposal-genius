/**
 * Input sanitization and validation utilities
 */

import DOMPurify from 'dompurify';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: string;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  });
};

/**
 * Sanitize and validate text input
 */
export const sanitizeAndValidateText = (
  input: string,
  rules: ValidationRule = {}
): ValidationResult => {
  const errors: string[] = [];
  
  // Basic sanitization
  let sanitized = input.trim();
  
  // Remove potential script injections
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Validation rules
  if (rules.required && !sanitized) {
    errors.push('This field is required');
  }
  
  if (rules.minLength && sanitized.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`);
  }
  
  if (rules.maxLength && sanitized.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
    sanitized = sanitized.substring(0, rules.maxLength);
  }
  
  if (rules.pattern && !rules.pattern.test(sanitized)) {
    errors.push('Invalid format');
  }
  
  if (rules.custom && !rules.custom(sanitized)) {
    errors.push('Custom validation failed');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return sanitizeAndValidateText(email, {
    required: true,
    maxLength: 254,
    pattern: emailRegex
  });
};

/**
 * Validate file name and type
 */
export const validateFile = (file: File, allowedTypes: string[] = []): ValidationResult => {
  const errors: string[] = [];
  
  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size exceeds 50MB limit');
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js'];
  const fileName = file.name.toLowerCase();
  const hasDangerousExtension = dangerousExtensions.some(ext => fileName.endsWith(ext));
  
  if (hasDangerousExtension) {
    errors.push('File type is not allowed for security reasons');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: file.name
  };
};

/**
 * SQL injection prevention for search queries
 */
export const sanitizeSearchQuery = (query: string): string => {
  // Remove SQL injection patterns
  let sanitized = query.replace(/[';-]/g, '');
  sanitized = sanitized.replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '');
  
  return sanitized.trim();
};

/**
 * Rate limiting check for client-side operations
 */
export class ClientRateLimit {
  private static instances = new Map<string, ClientRateLimit>();
  private attempts = new Map<string, { count: number; lastAttempt: number }>();
  
  private constructor(private key: string) {}
  
  static getInstance(key: string): ClientRateLimit {
    if (!this.instances.has(key)) {
      this.instances.set(key, new ClientRateLimit(key));
    }
    return this.instances.get(key)!;
  }
  
  checkLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now - record.lastAttempt > windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    record.lastAttempt = now;
    return true;
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}