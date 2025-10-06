
/**
 * Enhanced security validation utilities
 */

import { SECURITY_CONFIG } from './securityConfig';

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: any;
}

// Enhanced authentication validation
export const validateAuthCredentials = (email: string, password: string): SecurityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailTrimmed = email.trim().toLowerCase();
    if (emailTrimmed.length > SECURITY_CONFIG.INPUT_LIMITS.EMAIL_MAX) {
      errors.push(`Email must be less than ${SECURITY_CONFIG.INPUT_LIMITS.EMAIL_MAX} characters`);
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailTrimmed)) {
      errors.push('Please enter a valid email address');
    }
    
    // Check for suspicious patterns
    if (emailTrimmed.includes('..') || emailTrimmed.startsWith('.') || emailTrimmed.endsWith('.')) {
      errors.push('Email contains invalid patterns');
    }
  }
  
  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > SECURITY_CONFIG.INPUT_LIMITS.PASSWORD_MAX) {
      errors.push(`Password must be less than ${SECURITY_CONFIG.INPUT_LIMITS.PASSWORD_MAX} characters`);
    }
    
    if (!/[A-Z]/.test(password)) {
      warnings.push('Password should contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      warnings.push('Password should contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      warnings.push('Password should contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push('Password should contain at least one special character');
    }
    
    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty', '12345678'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password contains common weak patterns');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedValue: email ? { email: email.trim().toLowerCase(), password } : undefined
  };
};

// Validate file uploads with proper type checking
export const validateFileUpload = (file: File): SecurityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors, warnings };
  }
  
  // Size validation
  if (file.size > SECURITY_CONFIG.UPLOADS.MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${SECURITY_CONFIG.UPLOADS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Type validation - convert readonly array to regular array for includes check
  const allowedTypes = [...SECURITY_CONFIG.UPLOADS.ALLOWED_IMAGE_TYPES];
  if (!allowedTypes.includes(file.type as any)) {
    errors.push('File type not allowed. Please upload JPEG, PNG, WebP, or GIF files only');
  }
  
  // Extension validation - convert readonly array to regular array for includes check
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = [...SECURITY_CONFIG.UPLOADS.ALLOWED_EXTENSIONS];
  if (!allowedExtensions.includes(fileExtension as any)) {
    errors.push('File extension not allowed');
  }
  
  // Name validation
  if (file.name.length > 255) {
    errors.push('File name too long');
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif'];
  if (suspiciousPatterns.some(pattern => file.name.toLowerCase().includes(pattern))) {
    errors.push('Suspicious file detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Enhanced role validation
export const validateUserRole = (role: string, currentUserRole?: string): SecurityValidationResult => {
  const errors: string[] = [];
  const validRoles = ['user', 'moderator', 'admin'];
  
  if (!validRoles.includes(role)) {
    errors.push('Invalid role specified');
  }
  
  // Prevent privilege escalation
  if (currentUserRole && currentUserRole !== 'admin' && role === 'admin') {
    errors.push('Insufficient permissions to assign admin role');
  }
  
  if (currentUserRole === 'user' && ['moderator', 'admin'].includes(role)) {
    errors.push('Insufficient permissions to assign elevated roles');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    sanitizedValue: role
  };
};

// Validate session integrity
export const validateSession = (sessionData: any): SecurityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!sessionData) {
    errors.push('No session data provided');
    return { isValid: false, errors, warnings };
  }
  
  // Check session expiry
  if (sessionData.expires_at) {
    const expiresAt = new Date(sessionData.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      errors.push('Session has expired');
    } else if (expiresAt.getTime() - now.getTime() < SECURITY_CONFIG.SESSION.REFRESH_THRESHOLD) {
      warnings.push('Session expires soon, consider refreshing');
    }
  }
  
  // Validate user ID format
  if (sessionData.user?.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionData.user.id)) {
    errors.push('Invalid user ID format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
