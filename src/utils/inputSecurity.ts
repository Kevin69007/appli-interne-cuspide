/**
 * Input security and validation utilities
 */

// Simple validation functions without complex dependencies

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

export const sanitizeInput = (input: string, maxLength?: number): string => {
  if (!input) return '';
  
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }
  
  const emailTrimmed = email.trim().toLowerCase();
  
  if (emailTrimmed.length > 254) {
    errors.push('Email must be less than 254 characters');
  }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(emailTrimmed)) {
    errors.push('Please enter a valid email address');
  }
  
  // Check for suspicious patterns
  if (emailTrimmed.includes('..') || emailTrimmed.startsWith('.') || emailTrimmed.endsWith('.')) {
    errors.push('Email contains invalid patterns');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: emailTrimmed
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
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
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password should contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty', '12345678'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains common weak patterns');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: password
  };
};

export const validatePrivacySetting = (setting: string): ValidationResult => {
  const errors: string[] = [];
  const validSettings = ['user_only', 'friends_only', 'everyone'];
  
  if (!setting || typeof setting !== 'string') {
    errors.push('Privacy setting is required');
    return { isValid: false, errors };
  }
  
  if (!validSettings.includes(setting)) {
    errors.push('Invalid privacy setting');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: setting
  };
};

export const validateDescription = (description: string, maxLength: number = 500): ValidationResult => {
  const errors: string[] = [];
  
  if (!description) {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }
  
  if (typeof description !== 'string') {
    errors.push('Description must be text');
    return { isValid: false, errors };
  }
  
  if (description.length > maxLength) {
    errors.push(`Description must be less than ${maxLength} characters`);
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(description))) {
    errors.push('Description contains invalid content');
  }
  
  const sanitizedValue = sanitizeInput(description, maxLength);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
};

export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (trimmed.length > 20) {
    errors.push('Username must be less than 20 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed
  };
};

// Enhanced XSS detection
export const detectXSSPatterns = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /expression\s*\(/gi,
    /data:text\/html/gi,
    /<svg\b[^>]*on\w+/gi,
    /&#x[0-9a-f]+;/gi, // Hex entities
    /&#[0-9]+;/gi, // Decimal entities
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Enhanced SQL injection detection
export const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /('\s*(or|and)\s*')/i,
    /(union\s+select)/i,
    /(drop\s+table)/i,
    /(delete\s+from)/i,
    /(insert\s+into)/i,
    /(update\s+.*\s+set)/i,
    /(-{2,})/,
    /(\/\*.*\*\/)/,
    /(exec\s*\()/i,
    /(xp_cmdshell)/i,
    /(sp_executesql)/i,
    /(benchmark\s*\()/i,
    /(sleep\s*\()/i,
    /(waitfor\s+delay)/i,
    /(0x[0-9a-f]+)/i,
    /(char\s*\()/i,
    /(ascii\s*\()/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Comprehensive input validation
export const validateInputSecurity = (input: string, context: string = 'general'): ValidationResult => {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }
  
  // Check for XSS patterns
  if (detectXSSPatterns(input)) {
    errors.push('Input contains potentially dangerous content');
  }
  
  // Check for SQL injection patterns
  if (detectSQLInjection(input)) {
    errors.push('Input contains potentially dangerous SQL patterns');
  }
  
  // Context-specific validation
  switch (context) {
    case 'forum_content':
      // Allow some formatting but sanitize dangerous content
      if (input.length > 10000) {
        errors.push('Content too long (max 10,000 characters)');
      }
      break;
    case 'username':
      if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
        errors.push('Username contains invalid characters');
      }
      break;
    case 'email':
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(input)) {
        errors.push('Invalid email format');
      }
      break;
  }
  
  const sanitizedValue = sanitizeInput(input);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
};
