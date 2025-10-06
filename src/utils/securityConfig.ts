
/**
 * Security configuration and constants
 */

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    AUTH_ATTEMPTS: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    API_CALLS: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
    FILE_UPLOADS: { requests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
    PASSWORD_RESET: { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 resets per hour
  },
  
  // Session security
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
    REFRESH_THRESHOLD: 15 * 60 * 1000, // Refresh 15 minutes before expiry
    IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours idle timeout
  },
  
  // Input validation
  INPUT_LIMITS: {
    USERNAME_MAX: 30,
    EMAIL_MAX: 254,
    PASSWORD_MAX: 128,
    DESCRIPTION_MAX: 500,
    MESSAGE_MAX: 1000,
  },
  
  // File upload security
  UPLOADS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
} as const;

export const SENSITIVE_OPERATIONS = [
  'account_deletion',
  'password_change',
  'email_change',
  'role_modification',
  'payment_processing',
] as const;

export type SensitiveOperation = typeof SENSITIVE_OPERATIONS[number];
