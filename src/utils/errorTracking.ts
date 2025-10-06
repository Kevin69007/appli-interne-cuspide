/**
 * Enhanced error tracking and monitoring utility
 */

interface ErrorContext {
  userId?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  sessionId: string;
  connectionType?: string;
  browserInfo: {
    name: string;
    version: string;
    platform: string;
  };
  performanceMetrics?: {
    loadTime?: number;
    memoryUsage?: number;
  };
}

interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'api' | 'ui' | 'performance' | 'network' | 'unknown';
}

class ErrorTracker {
  private sessionId: string;
  private errors: TrackedError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.setupGlobalErrorHandling();
    this.trackUserEnvironment();
  }

  private setupGlobalErrorHandling() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        severity: 'high',
        category: 'unknown',
        additionalContext: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        severity: 'high',
        category: 'unknown',
        additionalContext: {
          type: 'unhandledrejection'
        }
      });
    });
  }

  private trackUserEnvironment() {
    console.log('🔍 User Environment:', {
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      localStorage: this.checkLocalStorageSupport(),
      sessionStorage: this.checkSessionStorageSupport(),
      browserInfo: this.getBrowserInfo()
    });
  }

  private checkLocalStorageSupport(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  private checkSessionStorageSupport(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  private getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
      version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
      version = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return { name: browser, version, platform: navigator.platform };
  }

  private getPerformanceMetrics() {
    try {
      const performance = window.performance;
      const memory = (performance as any).memory;
      
      return {
        loadTime: performance.timing ? 
          performance.timing.loadEventEnd - performance.timing.navigationStart : undefined,
        memoryUsage: memory ? memory.usedJSHeapSize : undefined
      };
    } catch (error) {
      return {};
    }
  }

  trackError(error: Error, options: {
    severity?: TrackedError['severity'];
    category?: TrackedError['category'];
    userId?: string;
    additionalContext?: Record<string, any>;
  } = {}) {
    const context: ErrorContext = {
      userId: options.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      connectionType: (navigator as any).connection?.effectiveType,
      browserInfo: this.getBrowserInfo(),
      performanceMetrics: this.getPerformanceMetrics()
    };

    const trackedError: TrackedError = {
      id: crypto.randomUUID(),
      message: error.message,
      stack: error.stack,
      context,
      severity: options.severity || 'medium',
      category: options.category || 'unknown'
    };

    this.errors.unshift(trackedError);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console with enhanced formatting
    this.logToConsole(trackedError, options.additionalContext);

    // In production, you might want to send critical errors to a monitoring service
    if (trackedError.severity === 'critical') {
      this.handleCriticalError(trackedError);
    }
  }

  private logToConsole(error: TrackedError, additionalContext?: Record<string, any>) {
    const emoji = {
      low: '💡',
      medium: '⚠️',
      high: '❌',
      critical: '🚨'
    }[error.severity];

    console.group(`${emoji} Error Tracked - ${error.category.toUpperCase()}`);
    console.error('Message:', error.message);
    console.log('Severity:', error.severity);
    console.log('Context:', error.context);
    if (additionalContext) {
      console.log('Additional Context:', additionalContext);
    }
    if (error.stack) {
      console.log('Stack:', error.stack);
    }
    console.groupEnd();
  }

  private handleCriticalError(error: TrackedError) {
    // In production, send to monitoring service
    console.error('🚨 CRITICAL ERROR DETECTED 🚨', error);
  }

  getErrors(filter?: {
    severity?: TrackedError['severity'];
    category?: TrackedError['category'];
    limit?: number;
  }): TrackedError[] {
    let filteredErrors = this.errors;

    if (filter?.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filter.severity);
    }

    if (filter?.category) {
      filteredErrors = filteredErrors.filter(e => e.category === filter.category);
    }

    if (filter?.limit) {
      filteredErrors = filteredErrors.slice(0, filter.limit);
    }

    return filteredErrors;
  }

  getCriticalErrors(): TrackedError[] {
    return this.getErrors({ severity: 'critical' });
  }

  getSessionSummary() {
    const errorsBySeverity = {
      low: this.errors.filter(e => e.severity === 'low').length,
      medium: this.errors.filter(e => e.severity === 'medium').length,
      high: this.errors.filter(e => e.severity === 'high').length,
      critical: this.errors.filter(e => e.severity === 'critical').length
    };

    const errorsByCategory = {
      authentication: this.errors.filter(e => e.category === 'authentication').length,
      api: this.errors.filter(e => e.category === 'api').length,
      ui: this.errors.filter(e => e.category === 'ui').length,
      performance: this.errors.filter(e => e.category === 'performance').length,
      network: this.errors.filter(e => e.category === 'network').length,
      unknown: this.errors.filter(e => e.category === 'unknown').length
    };

    return {
      sessionId: this.sessionId,
      totalErrors: this.errors.length,
      errorsBySeverity,
      errorsByCategory,
      userEnvironment: {
        browser: this.getBrowserInfo(),
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        online: navigator.onLine
      }
    };
  }

  clearErrors() {
    this.errors = [];
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Convenience functions
export const trackError = (error: Error, options?: Parameters<typeof errorTracker.trackError>[1]) => {
  errorTracker.trackError(error, options);
};

export const trackApiError = (error: Error, endpoint: string, userId?: string) => {
  trackError(error, {
    severity: 'high',
    category: 'api',
    userId,
    additionalContext: { endpoint }
  });
};

export const trackAuthError = (error: Error, userId?: string) => {
  trackError(error, {
    severity: 'high',
    category: 'authentication',
    userId
  });
};

export const trackNetworkError = (error: Error, url?: string, userId?: string) => {
  trackError(error, {
    severity: 'medium',
    category: 'network',
    userId,
    additionalContext: { url }
  });
};

export const trackUIError = (error: Error, component?: string, userId?: string) => {
  trackError(error, {
    severity: 'medium',
    category: 'ui',
    userId,
    additionalContext: { component }
  });
};
