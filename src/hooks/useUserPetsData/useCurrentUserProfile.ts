
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useCurrentUserProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchCurrentUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      console.log("🔍 Fetching current user profile:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, food_bags, water_bags, paw_points, username, feeding_privacy")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("❌ Error fetching current user profile:", error);
        return;
      }
      
      console.log("✅ Current user profile loaded:", data);
      setUserProfile(data);
    } catch (error) {
      console.error("❌ Exception fetching current user profile:", error);
    }
  };

  return {
    userProfile,
    setUserProfile,
    fetchCurrentUserProfile
  };
};
