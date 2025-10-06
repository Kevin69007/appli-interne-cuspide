
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackError, trackApiError, trackNetworkError } from "@/utils/errorTracking";
import { logAuthEvent } from "@/utils/securityLogger";

export const useDailyRewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInitialCheckCompleted, setHasInitialCheckCompleted] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const checkDailyRewards = async () => {
    if (!user) {
      console.log("🚫 Daily rewards check skipped: no user");
      logAuthEvent('Daily rewards check skipped: No authenticated user', 'info');
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isProcessing) {
      console.log("🔄 Daily rewards already processing, skipping");
      return;
    }

    // If user already claimed today, don't check again
    if (hasClaimedToday) {
      console.log("✅ User already claimed today, skipping check");
      setLoading(false);
      return;
    }

    setIsProcessing(true);
    
    try {
      setLoading(true);
      
      console.log("🎯 Checking daily rewards for user:", user.id);
      
      // Call server-side function directly
      const result = await processServerSideRewards();
      if (result) {
        setHasClaimedToday(true);
        setConsecutiveErrors(0); // Reset error counter on success
      }
    } catch (error) {
      console.error("❌ Error checking daily rewards:", error);
      
      const dailyRewardsError = error as Error;
      setConsecutiveErrors(prev => prev + 1);
      
      // Enhanced error tracking with context
      trackApiError(dailyRewardsError, 'daily-rewards', user.id);
      
      // Check if it's a network error
      if (dailyRewardsError.message.includes('fetch') || 
          dailyRewardsError.message.includes('network') ||
          !navigator.onLine) {
        trackNetworkError(dailyRewardsError, 'daily-rewards', user.id);
        logAuthEvent('Daily rewards check failed: Network error', 'warning', {
          userId: user.id,
          online: navigator.onLine,
          consecutiveErrors: consecutiveErrors + 1
        });
      }
      
      // Only show user-facing error after multiple consecutive failures
      if (consecutiveErrors >= 2 && hasInitialCheckCompleted) {
        toast({
          title: "Daily Rewards Temporarily Unavailable",
          description: "We're having trouble checking your daily rewards. This won't affect your other app functions.",
          variant: "destructive",
          duration: 6000,
        });
      }
      
    } finally {
      setLoading(false);
      setIsProcessing(false);
      setHasInitialCheckCompleted(true);
    }
  };

  const processServerSideRewards = async () => {
    if (!user) return false;

    try {
      console.log("🚀 Calling daily-rewards function...");
      
      const startTime = performance.now();

      // Call the edge function with just the user ID - no auth header needed
      const { data, error } = await supabase.functions.invoke('daily-rewards', {
        body: { 
          action: 'process_daily_reward',
          user_id: user.id
        }
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Log performance metrics
      console.log(`📊 Daily rewards API response time: ${responseTime.toFixed(2)}ms`);

      if (error) {
        console.error("❌ Server-side reward processing failed:", error);
        
        // Track specific edge function errors
        trackError(new Error(`Edge function error: ${error.message}`), {
          severity: 'high',
          category: 'api',
          userId: user.id,
          additionalContext: {
            functionName: 'daily-rewards',
            responseTime,
            errorCode: error.code || 'unknown'
          }
        });
        
        throw error;
      }

      console.log("📊 Daily rewards response:", data);

      if (data?.success && data?.message && !data?.message.includes('Already claimed')) {
        showSuccessToast(data.message);
        logAuthEvent('Daily rewards claimed successfully', 'info', {
          userId: user.id,
          responseTime
        });
        return true;
      } else if (data?.message === 'Already claimed today') {
        console.log("ℹ️ User already claimed rewards today (server confirmed)");
        setHasClaimedToday(true);
        return false;
      } else {
        console.log("⚠️ Server response:", data);
        return false;
      }
    } catch (error) {
      console.error("❌ Error processing server-side rewards:", error);
      
      // Enhanced error context for edge function calls
      trackError(error as Error, {
        severity: 'high',
        category: 'api',
        userId: user.id,
        additionalContext: {
          functionName: 'daily-rewards',
          connectionType: (navigator as any).connection?.effectiveType,
          online: navigator.onLine
        }
      });
      
      throw error;
    }
  };

  const showSuccessToast = (message: string) => {
    toast({
      title: "Daily Rewards Claimed! 🎉",
      description: message,
      duration: 4000,
    });
  };

  // Only run the check when user becomes available and reset flags on user change
  useEffect(() => {
    if (user && !isProcessing && !hasInitialCheckCompleted) {
      console.log("🎯 User authenticated, checking daily rewards...");
      setHasClaimedToday(false); // Reset claimed status for new check
      setConsecutiveErrors(0); // Reset error counter for new session
      checkDailyRewards();
    } else if (!user) {
      setLoading(false);
      setHasClaimedToday(false); // Reset claimed status when user logs out
      setHasInitialCheckCompleted(false); // Reset initial check flag
      setConsecutiveErrors(0); // Reset error counter
    }
  }, [user]); // Only depend on user

  return {
    hasClaimedToday,
    loading,
    checkDailyRewards,
    isProcessing,
    consecutiveErrors
  };
};
