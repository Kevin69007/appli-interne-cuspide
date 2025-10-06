
/**
 * Enhanced secure authentication hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecureAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionValid: boolean;
  lastActivity: Date | null;
  failedAttempts: number;
  isLocked: boolean;
}

export const useSecureAuth = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [authState, setAuthState] = useState<SecureAuthState>({
    isAuthenticated: false,
    isLoading: true,
    sessionValid: false,
    lastActivity: null,
    failedAttempts: 0,
    isLocked: false,
  });
  
  const activityTimer = useRef<NodeJS.Timeout>();
  const lockoutTimer = useRef<NodeJS.Timeout>();

  // Track user activity
  const updateActivity = useCallback(() => {
    setAuthState(prev => ({ ...prev, lastActivity: new Date() }));
  }, []);

  // Check for idle timeout
  const checkIdleTimeout = useCallback(() => {
    if (authState.lastActivity) {
      const timeSinceActivity = Date.now() - authState.lastActivity.getTime();
      const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
      
      if (timeSinceActivity > IDLE_TIMEOUT) {
        console.warn('Session expired due to inactivity');
        
        toast({
          title: "Session Expired",
          description: "You've been logged out due to inactivity",
          variant: "destructive",
        });
        signOut();
      }
    }
  }, [authState.lastActivity, signOut, toast]);

  // Enhanced session validation
  const validateCurrentSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session validation error:', error);
        return false;
      }

      if (!session) {
        setAuthState(prev => ({ ...prev, sessionValid: false, isAuthenticated: false }));
        return false;
      }

      setAuthState(prev => ({ 
        ...prev, 
        sessionValid: true, 
        isAuthenticated: true,
        lastActivity: new Date()
      }));
      
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, []);

  // Secure logout
  const secureLogout = useCallback(async () => {
    try {
      // Clear timers
      if (activityTimer.current) clearInterval(activityTimer.current);
      if (lockoutTimer.current) clearTimeout(lockoutTimer.current);

      // Sign out
      await signOut();
      
      // Reset state
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        sessionValid: false,
        lastActivity: null,
        failedAttempts: 0,
        isLocked: false,
      });

      toast({
        title: "Logged Out",
        description: "You have been securely logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [signOut, toast]);

  // Initialize security monitoring
  useEffect(() => {
    if (user) {
      validateCurrentSession();
      
      // Set up activity monitoring
      activityTimer.current = setInterval(checkIdleTimeout, 60000); // Check every minute
      
      // Add activity listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => document.addEventListener(event, updateActivity, true));
      
      return () => {
        if (activityTimer.current) clearInterval(activityTimer.current);
        events.forEach(event => document.removeEventListener(event, updateActivity, true));
      };
    }
  }, [user, validateCurrentSession, checkIdleTimeout, updateActivity]);

  return {
    ...authState,
    secureLogout,
    validateCurrentSession,
    updateActivity,
    isSecure: authState.isAuthenticated && authState.sessionValid,
  };
};
