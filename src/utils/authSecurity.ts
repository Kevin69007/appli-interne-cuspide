
/**
 * Authentication and authorization security utilities
 */

import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityContext {
  user: User | null;
  isAuthenticated: boolean;
  sessionValid: boolean;
  csrfToken?: string;
}

export const validateUserSession = async (): Promise<SecurityContext> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        user: null,
        isAuthenticated: false,
        sessionValid: false
      };
    }

    // Verify session is still valid
    const { data: session } = await supabase.auth.getSession();
    const sessionValid = !!(session?.session?.access_token);

    return {
      user,
      isAuthenticated: true,
      sessionValid,
      csrfToken: generateCSRFToken()
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return {
      user: null,
      isAuthenticated: false,
      sessionValid: false
    };
  }
};

export const generateCSRFToken = (): string => {
  return crypto.randomUUID();
};

export const validateCSRFToken = (token: string, expectedToken: string): boolean => {
  return token === expectedToken && token.length === 36; // UUID length
};

export const requireAuthentication = (user: User | null): boolean => {
  if (!user) {
    throw new Error('Authentication required');
  }
  return true;
};

export const requireOwnership = (resourceUserId: string, currentUserId: string): boolean => {
  if (resourceUserId !== currentUserId) {
    throw new Error('Access denied: You do not own this resource');
  }
  return true;
};

export const rateLimitCheck = (userId: string, action: string, limit: number = 60): boolean => {
  const key = `${userId}:${action}:${Math.floor(Date.now() / 60000)}`;
  const stored = localStorage.getItem(key);
  const count = stored ? parseInt(stored) : 0;
  
  if (count >= limit) {
    throw new Error(`Rate limit exceeded for ${action}. Please try again later.`);
  }
  
  localStorage.setItem(key, (count + 1).toString());
  return true;
};

export const logSecurityEvent = (event: string, details: any = {}) => {
  console.warn(`Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...details
  });
};
