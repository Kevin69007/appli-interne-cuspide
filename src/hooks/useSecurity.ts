
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logAuthEvent, logSuspiciousActivity } from '@/utils/securityLogger';
import { rateLimitAction } from '@/utils/rateLimiter';
import { useToast } from '@/hooks/use-toast';

export const useSecurity = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Log successful session establishment
      logAuthEvent('session_active', 'info', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user]);

  const logRateLimitEvent = (action: string, details?: Record<string, any>) => {
    logSuspiciousActivity(`rate_limit_${action}`, 'warning', {
      action,
      timestamp: new Date().toISOString(),
      ...details,
    }, user?.id);
  };

  const logSecurityViolation = (violation: string, details?: Record<string, any>) => {
    logSuspiciousActivity(violation, 'error', {
      violation,
      timestamp: new Date().toISOString(),
      ...details,
    }, user?.id);
  };

  const checkRateLimit = async (action: string, maxAttempts: number = 5) => {
    if (!user) return false;

    try {
      const result = await rateLimitAction(action as any, user.id);
      
      if (!result.allowed) {
        logRateLimitEvent(action, { remainingAttempts: result.remainingAttempts });
        toast({
          title: "Rate Limit Exceeded",
          description: result.message || "Please try again later",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow on error to avoid blocking users
    }
  };

  const secureApiCall = async (
    apiCall: () => Promise<any>,
    options?: {
      requireAuth?: boolean;
      checkOwnership?: string;
      rateLimit?: { action: string; limit: number };
      logAction?: string;
    }
  ) => {
    const opts = {
      requireAuth: true,
      ...options,
    };

    // Check authentication
    if (opts.requireAuth && !user) {
      throw new Error('Authentication required');
    }

    // Check rate limiting
    if (opts.rateLimit && user) {
      const rateLimitPassed = await checkRateLimit(opts.rateLimit.action, opts.rateLimit.limit);
      if (!rateLimitPassed) {
        throw new Error('Rate limit exceeded');
      }
    }

    // Log the action
    if (opts.logAction) {
      logAuthEvent(opts.logAction, 'info', { userId: user?.id });
    }

    // Execute the API call
    return await apiCall();
  };

  return {
    logRateLimitEvent,
    logSecurityViolation,
    checkRateLimit,
    secureApiCall,
  };
};
