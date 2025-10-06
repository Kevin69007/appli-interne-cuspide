import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyXPProgress {
  dailyXPEarned: number;
  dailyLimit: number;
  remainingXP: number;
  percentage: number;
  isPawClubMember: boolean;
}

export const useDailyXPProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<DailyXPProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDailyXPProgress = async () => {
    if (!user) {
      setProgress(null);
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("daily_xp_earned, last_xp_date, pawclub_member")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        console.error("Error fetching daily XP progress:", error);
        setProgress(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const isNewDay = !profile.last_xp_date || profile.last_xp_date !== today;
      
      const dailyXPEarned = isNewDay ? 0 : (profile.daily_xp_earned || 0);
      const isPawClubMember = profile.pawclub_member || false;
      const dailyLimit = isPawClubMember ? 20000 : 10000;
      const remainingXP = Math.max(0, dailyLimit - dailyXPEarned);
      const percentage = (dailyXPEarned / dailyLimit) * 100;

      setProgress({
        dailyXPEarned,
        dailyLimit,
        remainingXP,
        percentage,
        isPawClubMember
      });
    } catch (error) {
      console.error("Error fetching daily XP progress:", error);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyXPProgress();
  }, [user]);

  return { progress, loading, refetch: fetchDailyXPProgress };
};