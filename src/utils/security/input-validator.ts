/**
 * Server-side style input validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  /**
   * Validates email format with enhanced checks
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
    
    // Length check
    if (email.length > 254) {
      errors.push('Email address is too long');
    }
    
    // Domain validation
    const domain = email.split('@')[1];
    if (domain && domain.length > 253) {
      errors.push('Email domain is too long');
    }
    
    // Check for dangerous characters
    if (/[<>"'&;]/.test(email)) {
      errors.push('Email contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates text input with XSS protection
   */
  static validateText(text: string, maxLength: number = 1000): ValidationResult {
    const errors: string[] = [];
    
    // Length check
    if (text.length > maxLength) {
      errors.push(`Text must be ${maxLength} characters or less`);
    }
    
    // XSS protection - check for script tags and dangerous patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        errors.push('Text contains potentially dangerous content');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates file upload
   */
  static validateFile(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
    const errors: string[] = [];
    
    // Type check
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    // Size check
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    // Name check
    if (file.name.length > 255) {
      errors.push('File name is too long');
    }
    
    // Check for dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.jar'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(extension)) {
      errors.push('File type is not allowed for security reasons');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates URL format and safety
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    try {
      const urlObj = new URL(url);
      
      // Only allow http/https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are allowed');
      }
      
      // Check for dangerous patterns
      if (/javascript:|data:|vbscript:/i.test(url)) {
        errors.push('URL contains potentially dangerous protocol');
      }
      
    } catch {
      errors.push('Invalid URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates UUID format
   */
  static validateUuid(uuid: string): ValidationResult {
    const errors: string[] = [];
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      errors.push('Invalid UUID format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitizes text input for safe storage
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Validates organization name
   */
  static validateOrganizationName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (name.length < 2) {
      errors.push('Organization name must be at least 2 characters');
    }
    
    if (name.length > 100) {
      errors.push('Organization name must be 100 characters or less');
    }
    
    // Check for dangerous characters
    if (/[<>"'&;]/.test(name)) {
      errors.push('Organization name contains invalid characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates project title
   */
  static validateProjectTitle(title: string): ValidationResult {
    const errors: string[] = [];
    
    if (title.length < 3) {
      errors.push('Project title must be at least 3 characters');
    }
    
    if (title.length > 200) {
      errors.push('Project title must be 200 characters or less');
    }
    
    return this.validateText(title, 200);
  }
}