
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useBreedingStatus = () => {
  const { user } = useAuth();
  const [breedingPets, setBreedingPets] = useState<Set<string>>(new Set());

  const checkBreedingStatus = async () => {
    if (!user) return;
    
    try {
      // Get the user's profile using the id column (which references auth.users)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Query breeding pairs for this user
      const { data: breedingPairs, error } = await supabase
        .from("breeding_pairs")
        .select("parent1_id, parent2_id")
        .eq("user_id", profile.id)
        .eq("is_completed", false);

      if (error) throw error;

      const activeBreeders = new Set<string>();
      if (breedingPairs) {
        breedingPairs.forEach((pair: any) => {
          activeBreeders.add(pair.parent1_id.toString());
          activeBreeders.add(pair.parent2_id.toString());
        });
      }

      setBreedingPets(activeBreeders);
    } catch (error) {
      console.error("Error checking breeding status:", error);
    }
  };

  useEffect(() => {
    if (user) {
      checkBreedingStatus();
    }
  }, [user]);

  return { breedingPets, checkBreedingStatus };
};
