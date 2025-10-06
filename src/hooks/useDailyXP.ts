
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { recordXPTransaction } from "@/utils/transactionUtils";

interface XPResult {
  success: boolean;
  xpAwarded: number;
  reason?: string;
  newTotal?: number;
}

export const useDailyXP = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkAndAwardXP = async (xpAmount: number, activityType: string): Promise<XPResult> => {
    if (!user) {
      console.log("❌ No user found for XP award");
      return { success: false, xpAwarded: 0, reason: "No user logged in" };
    }

    console.log(`🎯 XP AWARD ATTEMPT: ${xpAmount} XP for ${activityType}, User: ${user.id}`);
    
    setLoading(true);
    try {
      // Get current user profile with daily XP tracking
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("xp, daily_xp_earned, last_xp_date, pawclub_member")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Profile fetch error for XP award:", profileError);
        return { success: false, xpAwarded: 0, reason: "Failed to fetch profile" };
      }

      if (!profile) {
        console.error("❌ Profile not found for XP award");
        return { success: false, xpAwarded: 0, reason: "Profile not found" };
      }

      const currentXP = profile.xp || 0;
      const currentDailyXP = profile.daily_xp_earned || 0;
      const lastXPDate = profile.last_xp_date;
      const isPawClubMember = profile.pawclub_member || false;
      
      // Check if we need to reset daily XP (new day)
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const isNewDay = !lastXPDate || lastXPDate !== today;
      
      // Reset daily XP if it's a new day
      const dailyXPToday = isNewDay ? 0 : currentDailyXP;
      
      // Set daily limits based on PawClub membership
      const dailyLimit = isPawClubMember ? 20000 : 10000;
      const remainingDailyXP = dailyLimit - dailyXPToday;
      
      console.log(`📊 Daily XP Status: ${dailyXPToday}/${dailyLimit} (PawClub: ${isPawClubMember})`);
      
      // Check if user has reached daily limit
      if (remainingDailyXP <= 0) {
        console.log(`🚫 Daily XP limit reached for ${activityType}`);
        return { 
          success: false, 
          xpAwarded: 0, 
          reason: `Daily XP limit reached (${dailyLimit} XP). Resets at midnight.` 
        };
      }
      
      // Award only up to the remaining daily limit
      const actualXPAwarded = Math.min(xpAmount, remainingDailyXP);
      const newXP = currentXP + actualXPAwarded;
      const newDailyXP = dailyXPToday + actualXPAwarded;
      
      console.log(`🎯 XP UPDATE: ${currentXP} -> ${newXP} (+${actualXPAwarded}), Daily: ${dailyXPToday} -> ${newDailyXP}`);

      // Update XP and daily tracking in profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          xp: newXP,
          daily_xp_earned: newDailyXP,
          last_xp_date: today
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("❌ XP profile update error:", updateError);
        return { success: false, xpAwarded: 0, reason: "Failed to update profile XP" };
      }

      console.log(`✅ XP profile updated successfully`);

      // Record XP transaction with enhanced error handling
      try {
        await recordXPTransaction(user.id, actualXPAwarded, activityType, `Earned ${actualXPAwarded} XP for ${activityType}`);
        console.log(`✅ XP transaction recorded successfully`);
      } catch (transactionError) {
        console.error("❌ XP transaction recording error:", transactionError);
        // Don't fail the XP award for transaction recording issues
      }

      console.log(`🎉 XP AWARD SUCCESS: ${actualXPAwarded} XP awarded for ${activityType}`);
      
      return { 
        success: true, 
        xpAwarded: actualXPAwarded, 
        newTotal: newXP,
        reason: actualXPAwarded < xpAmount 
          ? `Awarded ${actualXPAwarded} XP (${dailyLimit - newDailyXP} remaining today)` 
          : `Successfully awarded ${actualXPAwarded} XP`
      };

    } catch (error) {
      console.error("❌ XP award process error:", error);
      return { 
        success: false, 
        xpAwarded: 0, 
        reason: `XP award failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    } finally {
      setLoading(false);
    }
  };

  return { checkAndAwardXP, loading };
};
