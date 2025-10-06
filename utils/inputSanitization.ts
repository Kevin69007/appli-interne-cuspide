
import { logInvalidInput } from "./securityLogger";

// Input sanitization and validation utilities
export const sanitizeString = (input: string, maxLength: number = 1000, userId?: string): string => {
  if (typeof input !== 'string') {
    if (userId) logInvalidInput('string_type', typeof input, userId);
    return '';
  }
  
  const sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, maxLength);

  // Log if suspicious content was removed
  if (sanitized !== input.trim() && userId) {
    logInvalidInput('suspicious_content', input.substring(0, 100), userId);
  }

  return sanitized;
};

export const sanitizeUsername = (username: string, userId?: string): string => {
  if (typeof username !== 'string') {
    if (userId) logInvalidInput('username_type', typeof username, userId);
    return '';
  }
  
  const sanitized = username
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, and hyphen
    .substring(0, 50);

  // Log if invalid characters were removed
  if (sanitized !== username.trim() && userId) {
    logInvalidInput('username_invalid_chars', username, userId);
  }

  return sanitized;
};

export const sanitizePetName = (petName: string, userId?: string): string => {
  if (typeof petName !== 'string') {
    if (userId) logInvalidInput('pet_name_type', typeof petName, userId);
    return '';
  }
  
  const sanitized = petName
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s.-]/g, '') // Allow alphanumeric, spaces, dots, and hyphens
    .substring(0, 100);

  if (sanitized !== petName.trim() && userId) {
    logInvalidInput('pet_name_invalid_chars', petName, userId);
  }

  return sanitized;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePositiveInteger = (value: any, userId?: string): number | null => {
  const num = parseInt(value, 10);
  const isValid = !isNaN(num) && num > 0;
  
  if (!isValid && userId) {
    logInvalidInput('positive_integer', String(value), userId);
  }
  
  return isValid ? num : null;
};

export const validatePetStats = (stat: any, userId?: string): number => {
  const num = parseInt(stat, 10);
  const isValid = !isNaN(num) && num >= 0 && num <= 100;
  
  if (!isValid && userId) {
    logInvalidInput('pet_stats', String(stat), userId);
  }
  
  return isValid ? num : 50; // Default to 50 if invalid
};

export const sanitizeDescription = (description: string, userId?: string): string => {
  if (typeof description !== 'string') {
    if (userId) logInvalidInput('description_type', typeof description, userId);
    return '';
  }
  
  const sanitized = description
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .substring(0, 2000);

  if (sanitized !== description.trim() && userId) {
    logInvalidInput('description_suspicious', description.substring(0, 100), userId);
  }

  return sanitized;
};

export const validateUUID = (uuid: string, userId?: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(uuid);
  
  if (!isValid && userId) {
    logInvalidInput('uuid_format', uuid, userId);
  }
  
  return isValid;
};

// Enhanced SQL injection prevention
export const containsSqlInjection = (input: string): boolean => {
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
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// Enhanced XSS prevention
export const containsXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

export const validateAndSanitizeInput = (
  input: any, 
  type: 'string' | 'username' | 'petName' | 'description' | 'email' | 'uuid',
  userId?: string
): string | null => {
  if (!input) return null;
  
  const stringInput = String(input);
  
  // Check for SQL injection patterns
  if (containsSqlInjection(stringInput)) {
    console.warn('Potential SQL injection attempt detected');
    if (userId) logInvalidInput('sql_injection_attempt', stringInput.substring(0, 100), userId);
    return null;
  }
  
  // Check for XSS patterns
  if (containsXSS(stringInput)) {
    console.warn('Potential XSS attempt detected');
    if (userId) logInvalidInput('xss_attempt', stringInput.substring(0, 100), userId);
    return null;
  }
  
  switch (type) {
    case 'username':
      return sanitizeUsername(stringInput, userId);
    case 'petName':
      return sanitizePetName(stringInput, userId);
    case 'description':
      return sanitizeDescription(stringInput, userId);
    case 'email':
      return validateEmail(stringInput) ? stringInput.toLowerCase().trim() : null;
    case 'uuid':
      return validateUUID(stringInput, userId) ? stringInput : null;
    default:
      return sanitizeString(stringInput, 1000, userId);
  }
};

// File upload validation
export const validateFileUpload = (file: File, userId?: string): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // Check file size
  if (file.size > maxSize) {
    if (userId) logInvalidInput('file_size_exceeded', `${file.size} bytes`, userId);
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    if (userId) logInvalidInput('invalid_file_type', file.type, userId);
    return { valid: false, error: 'Invalid file type. Only images are allowed.' };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    if (userId) logInvalidInput('invalid_file_extension', extension, userId);
    return { valid: false, error: 'Invalid file extension' };
  }
  
  return { valid: true };
};
