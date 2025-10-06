
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logAuthEvent, logSuspiciousActivity } from '@/utils/securityLogger';
import { validateInputSecurity } from '@/utils/inputSecurity';

interface SecurityMiddlewareProps {
  children: React.ReactNode;
}

const SecurityMiddleware = ({ children }: SecurityMiddlewareProps) => {
  const { user, session } = useAuth();

  useEffect(() => {
    // Monitor for session changes and log security events
    if (user && session) {
      // Log successful authentication
      logAuthEvent('session_established', 'info', {
        userId: user.id,
        sessionStarted: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
      });

      // Check for session security
      const checkSessionSecurity = () => {
        // Check if session is close to expiry
        if (session.expires_at) {
          const expiryTime = session.expires_at * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;
          
          // Log if session expires soon (less than 5 minutes)
          if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
            logAuthEvent('session_expiring_soon', 'warning', {
              userId: user.id,
              timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
            });
          }
        }
      };

      // Check session security every minute
      const securityCheckInterval = setInterval(checkSessionSecurity, 60 * 1000);
      
      return () => clearInterval(securityCheckInterval);
    }
  }, [user, session]);

  useEffect(() => {
    // Monitor for potential security threats in the browser
    const handleVisibilityChange = () => {
      if (document.hidden && user) {
        logAuthEvent('session_hidden', 'info', {
          userId: user.id,
          hiddenAt: new Date().toISOString(),
        });
      }
    };

    // Enhanced developer tools detection
    const handleDevToolsDetection = () => {
      const threshold = 160;
      const heightDiff = window.outerHeight - window.innerHeight;
      const widthDiff = window.outerWidth - window.innerWidth;
      
      if (heightDiff > threshold || widthDiff > threshold) {
        if (user) {
          logSuspiciousActivity('devtools_detected', 'info', {
            userId: user.id,
            windowDimensions: {
              outer: { width: window.outerWidth, height: window.outerHeight },
              inner: { width: window.innerWidth, height: window.innerHeight },
              diff: { height: heightDiff, width: widthDiff }
            }
          });
        }
      }
    };

    // Monitor for suspicious console activity
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      // Check for potential injection attempts in console
      const message = args.join(' ');
      if (message.includes('<script>') || message.includes('javascript:')) {
        if (user) {
          logSuspiciousActivity('console_injection_attempt', 'warning', {
            userId: user.id,
            message: message.substring(0, 100)
          });
        }
      }
      originalConsoleLog.apply(console, args);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleDevToolsDetection);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleDevToolsDetection);
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, [user]);

  // Monitor for paste events that might contain malicious content
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (user && event.clipboardData) {
        const pastedText = event.clipboardData.getData('text');
        const validation = validateInputSecurity(pastedText, 'general');
        
        if (!validation.isValid) {
          logSuspiciousActivity('malicious_paste_detected', 'warning', {
            userId: user.id,
            errors: validation.errors,
            contentPreview: pastedText.substring(0, 50)
          });
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [user]);

  return <>{children}</>;
};

export default SecurityMiddleware;
