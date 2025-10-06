
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { useDailyRewards } from "@/hooks/useDailyRewards";

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userPets, setUserPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFirstPet, setHasFirstPet] = useState<boolean | null>(null);

  // Initialize daily rewards check only
  const { checkDailyRewards } = useDailyRewards();

  const fetchProfileData = async () => {
    if (!user) {
      console.log("Profile - No user, cannot fetch profile data");
      return;
    }

    try {
      console.log("Profile - Fetching profile for user ID:", user.id);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, paw_dollars, paw_points, care_badge_days")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile - Profile error:", profileError);
        throw profileError;
      }

      console.log("🎯 Profile - Profile data received:", {
        username: profileData?.username,
        xp: profileData?.xp,
        paw_dollars: profileData?.paw_dollars,
        paw_points: profileData?.paw_points,
        care_badge_days: profileData?.care_badge_days,
        pawclub_member: profileData?.pawclub_member
      });

      // Fetch user pets with optimized query - get all breeding status in one go
      console.log("🐾 Fetching pets for user:", profileData.id);
      const { data: petsData, error: petsError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (name, type)
        `)
        .eq("user_id", profileData.id)
        .order("display_order", { ascending: true })
        .order("adopted_at", { ascending: true });

      if (petsError) {
        console.error("Profile - Pets error:", petsError);
        throw petsError;
      }

      console.log("Profile - Pets data received:", petsData);

      // Get all active breeding pairs in one query to check breeding status efficiently
      let activePetIds = new Set();
      if (petsData && petsData.length > 0) {
        const petIds = petsData.map(pet => pet.id);
        
        const { data: activePairs, error: breedingError } = await supabase
          .from("breeding_pairs")
          .select("parent1_id, parent2_id")
          .or(`parent1_id.in.(${petIds.join(',')}),parent2_id.in.(${petIds.join(',')})`)
          .eq("is_completed", false);

        if (breedingError) {
          console.error("Error checking breeding pairs:", breedingError);
        } else if (activePairs) {
          // Create a set of pet IDs that are currently breeding
          activePairs.forEach(pair => {
            if (pair.parent1_id) activePetIds.add(pair.parent1_id);
            if (pair.parent2_id) activePetIds.add(pair.parent2_id);
          });
          console.log("🍼 Found", activePetIds.size, "pets in active breeding");
        }
      }

      // Update pets with current stats and breeding status
      const updatedPets = (petsData || []).map(pet => {
        const processedPet = calculateCurrentStats(pet);
        
        // Set breeding status based on our efficient lookup
        processedPet.is_for_breeding = activePetIds.has(pet.id);
        
        return processedPet;
      });

      setProfile(profileData);
      setUserPets(updatedPets);
      setHasFirstPet(updatedPets.length > 0);
      
      console.log("Profile - State updated, hasFirstPet:", updatedPets.length > 0);
    } catch (error) {
      console.error("Profile - Error fetching profile data:", error);
      setHasFirstPet(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      console.log("Profile - Fetching profile data for user:", user.id);
      fetchProfileData();
    }
  }, [user, authLoading]);

  return {
    profile,
    userPets,
    loading,
    hasFirstPet,
    authLoading,
    user,
    fetchProfileData
  };
};
