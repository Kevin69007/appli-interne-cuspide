
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useTargetProfile = () => {
  const [profile, setProfile] = useState<any>(null);

  const fetchProfile = async (actualTargetUserId: string) => {
    if (!actualTargetUserId) return;
    
    try {
      console.log("🔍 Fetching target profile:", actualTargetUserId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", actualTargetUserId)
        .single();
      
      if (error) {
        console.error("❌ Error fetching target profile:", error);
        return;
      }
      
      console.log("✅ Target profile loaded:", data);
      setProfile(data);
    } catch (error) {
      console.error("❌ Exception fetching target profile:", error);
    }
  };

  return {
    profile,
    setProfile,
    fetchProfile
  };
};
