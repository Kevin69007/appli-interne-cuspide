
import { supabase } from "@/integrations/supabase/client";

export interface SecurityEvent {
  action: string;
  userId?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // Get client IP and user agent if available
    const ipAddress = event.ipAddress || 'unknown';
    const userAgent = event.userAgent || navigator?.userAgent || 'unknown';

    // Use the new secure logging function
    const { error } = await supabase.rpc('log_security_event', {
      event_type_param: event.action,
      event_data_param: {
        severity: event.severity,
        details: event.details || {},
        ip_address: ipAddress,
        user_agent: userAgent,
        user_id: event.userId
      },
      severity_param: event.severity
    });

    if (error) {
      console.error('Failed to log security event to database:', error);
    }

    // Also log to console for development
    console.log(`🔒 Security Event [${event.severity.toUpperCase()}]:`, {
      action: event.action,
      userId: event.userId,
      details: event.details,
    });

  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const logAuthEvent = (action: string, severity: SecurityEvent['severity'] = 'info', details?: Record<string, any>) => {
  logSecurityEvent({
    action: `auth_${action}`,
    severity,
    details,
  });
};

export const logDataAccess = (table: string, operation: string, userId?: string, recordId?: string) => {
  logSecurityEvent({
    action: `data_access_${operation}`,
    userId,
    severity: 'info',
    details: {
      table,
      operation,
      recordId,
    },
  });
};

export const logFinancialTransaction = (action: string, userId: string, amount: number, details?: Record<string, any>) => {
  logSecurityEvent({
    action: `financial_${action}`,
    userId,
    severity: 'critical',
    details: {
      amount,
      ...details,
    },
  });
};

export const logSuspiciousActivity = (action: string, severity: SecurityEvent['severity'] = 'error', details?: Record<string, any>, userId?: string) => {
  logSecurityEvent({
    action: `suspicious_${action}`,
    userId,
    severity,
    details,
  });
};

export const logInvalidInput = (field: string, value: string, userId?: string) => {
  logSecurityEvent({
    action: 'invalid_input_attempt',
    userId,
    severity: 'warning',
    details: {
      field,
      value: value.substring(0, 100), // Truncate for security
      timestamp: new Date().toISOString(),
    },
  });
};

export const logRoleEscalation = (attemptedRole: string, userId: string, details?: Record<string, any>) => {
  logSecurityEvent({
    action: 'role_escalation_attempt',
    userId,
    severity: 'critical',
    details: {
      attempted_role: attemptedRole,
      ...details,
    },
  });
};
