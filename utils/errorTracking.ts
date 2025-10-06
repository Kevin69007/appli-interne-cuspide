
import { supabase } from "@/integrations/supabase/client";

export interface ErrorContext {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'api' | 'ui' | 'auth' | 'database' | 'network' | 'validation';
  userId?: string;
  additionalContext?: Record<string, any>;
}

export const trackError = (error: Error, context: ErrorContext) => {
  // Log to console for development
  console.error(`🚨 Error [${context.severity.toUpperCase()}] [${context.category.toUpperCase()}]:`, {
    message: error.message,
    stack: error.stack,
    context: context.additionalContext,
    userId: context.userId,
  });

  // Log to security audit log for tracking
  supabase.from('security_audit_log').insert({
    action: `error_${context.category}`,
    user_id: context.userId || null,
    old_values: null,
    new_values: {
      error_message: error.message,
      error_stack: error.stack,
      severity: context.severity,
      category: context.category,
      ...context.additionalContext,
    },
  }).then(({ error: logError }) => {
    if (logError) {
      console.error('Failed to log error to audit trail:', logError);
    }
  });
};

export const trackApiError = (error: Error, endpoint: string, userId?: string) => {
  trackError(error, {
    severity: 'high',
    category: 'api',
    userId,
    additionalContext: {
      endpoint,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackNetworkError = (error: Error, operation: string, userId?: string) => {
  trackError(error, {
    severity: 'medium',
    category: 'network',
    userId,
    additionalContext: {
      operation,
      online: navigator.onLine,
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackValidationError = (error: Error, field: string, value: any, userId?: string) => {
  trackError(error, {
    severity: 'low',
    category: 'validation',
    userId,
    additionalContext: {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value, // Limit string values
      timestamp: new Date().toISOString(),
    },
  });
};

export const trackAuthError = (error: Error, operation: string, userId?: string) => {
  trackError(error, {
    severity: 'critical',
    category: 'auth',
    userId,
    additionalContext: {
      operation,
      timestamp: new Date().toISOString(),
    },
  });
};
