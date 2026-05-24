// lib/input-validator.ts - Input validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

export interface FileValidationOptions {
  maxSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

export class InputValidator {
  static validateUUID(value: string): ValidationResult {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!value || typeof value !== 'string') {
      return { isValid: false, errors: ['UUID is required'] };
    }
    
    if (!uuidRegex.test(value)) {
      return { isValid: false, errors: ['Invalid UUID format'] };
    }
    
    return { 
      isValid: true, 
      errors: [], 
      sanitizedValue: value.trim() 
    };
  }

  static validateFile(file: File, options: FileValidationOptions): ValidationResult {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > options.maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${options.maxSize / (1024 * 1024)}MB`);
    }
    
    // Check file type
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !options.allowedExtensions.includes(extension)) {
      errors.push(`File extension .${extension} is not allowed`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || typeof email !== 'string') {
      return { isValid: false, errors: ['Email is required'] };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, errors: ['Invalid email format'] };
    }
    
    return { 
      isValid: true, 
      errors: [], 
      sanitizedValue: email.trim().toLowerCase() 
    };
  }

  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
      return { isValid: false, errors: ['Password is required'] };
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateRequired(value: any, fieldName: string): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }
    
    return { 
      isValid: true, 
      errors: [], 
      sanitizedValue: typeof value === 'string' ? value.trim() : value 
    };
  }
}
