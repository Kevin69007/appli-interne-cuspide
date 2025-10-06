
import { supabase } from "@/integrations/supabase/client";

interface RateLimitConfig {
  action: string;
  maxAttempts: number;
  windowMinutes: number;
  userId: string;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
  message?: string;
}

export const checkRateLimit = async (config: RateLimitConfig): Promise<RateLimitResult> => {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  try {
    // Get current rate limit data
    const { data: rateLimits, error } = await supabase
      .from('rate_limits')
      .select('count, window_start')
      .eq('user_id', config.userId)
      .eq('action', config.action)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the action but log it
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        message: 'Rate limit check failed, allowing action'
      };
    }

    const currentLimit = rateLimits?.[0];
    const now = new Date();

    if (!currentLimit || new Date(currentLimit.window_start) < windowStart) {
      // No recent rate limit or expired, create new one
      await supabase.from('rate_limits').insert({
        user_id: config.userId,
        action: config.action,
        count: 1,
        window_start: now.toISOString(),
      });

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      };
    }

    if (currentLimit.count >= config.maxAttempts) {
      // Rate limit exceeded
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: new Date(new Date(currentLimit.window_start).getTime() + config.windowMinutes * 60 * 1000),
        message: `Rate limit exceeded. Try again after ${config.windowMinutes} minutes.`
      };
    }

    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ count: currentLimit.count + 1 })
      .eq('user_id', config.userId)
      .eq('action', config.action)
      .eq('window_start', currentLimit.window_start);

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - currentLimit.count - 1,
      resetTime: new Date(new Date(currentLimit.window_start).getTime() + config.windowMinutes * 60 * 1000),
    };

  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the action
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
      message: 'Rate limit error, allowing action'
    };
  }
};

// Predefined rate limit configurations
export const RATE_LIMITS = {
  MESSAGE_SEND: { maxAttempts: 10, windowMinutes: 1 },
  PET_SALE: { maxAttempts: 5, windowMinutes: 5 },
  PROFILE_UPDATE: { maxAttempts: 3, windowMinutes: 5 },
  LOGIN_ATTEMPT: { maxAttempts: 5, windowMinutes: 15 },
  FINANCIAL_TRANSACTION: { maxAttempts: 10, windowMinutes: 1 },
} as const;

export const rateLimitAction = async (action: keyof typeof RATE_LIMITS, userId: string): Promise<RateLimitResult> => {
  const config = RATE_LIMITS[action];
  return checkRateLimit({
    action,
    userId,
    ...config,
  });
};
