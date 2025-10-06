
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateCurrentStats } from "@/utils/petHelpers";

export const usePetsFetching = () => {
  const [userPets, setUserPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPets = async (actualTargetUserId: string) => {
    if (!actualTargetUserId) return;

    try {
      setLoading(true);
      console.log("UserPets - Fetching pets for user:", actualTargetUserId);
      
      // First get the profile to get the integer ID
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", actualTargetUserId)
        .single();

      if (!profileData) {
        console.log("UserPets - No profile found for user");
        setUserPets([]);
        return;
      }

      // Fetch pets with optimized ordering
      const { data: petsData, error: petsError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (name, type)
        `)
        .eq("user_id", profileData.id)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true }); // Stable secondary sort

      if (petsError) {
        console.error("Error fetching pets:", petsError);
        return;
      }

      console.log("UserPets - Raw pets data received:", petsData?.length || 0, "pets");

      if (!petsData || petsData.length === 0) {
        setUserPets([]);
        return;
      }

      // Optimized breeding status check - single query for all pets
      const petIds = petsData.map(pet => pet.id);
      let activePetIds = new Set();

      const { data: activePairs, error: breedingError } = await supabase
        .from("breeding_pairs")
        .select("parent1_id, parent2_id")
        .or(`parent1_id.in.(${petIds.join(',')}),parent2_id.in.(${petIds.join(',')})`)
        .eq("is_completed", false);

      if (breedingError) {
        console.error("Error checking breeding pairs:", breedingError);
      } else if (activePairs) {
        activePairs.forEach(pair => {
          if (pair.parent1_id) activePetIds.add(pair.parent1_id);
          if (pair.parent2_id) activePetIds.add(pair.parent2_id);
        });
      }

      // Process pets with unified calculation and breeding status
      const processedPets = petsData.map(pet => {
        const processedPet = calculateCurrentStats(pet);
        
        // Set breeding status efficiently
        processedPet.is_for_breeding = activePetIds.has(pet.id);
        
        console.log(`📊 UNIFIED PROCESSED STATS for ${pet.pet_name}:`, {
          hunger: processedPet.hunger,
          water: processedPet.water,
          is_breeding: processedPet.is_for_breeding,
          friendliness: processedPet.friendliness,
          playfulness: processedPet.playfulness,
          energy: processedPet.energy,
          loyalty: processedPet.loyalty,
          curiosity: processedPet.curiosity
        });
        
        return processedPet;
      });

      setUserPets(processedPets);
    } catch (error) {
      console.error("Error fetching user pets:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    userPets,
    setUserPets,
    loading,
    setLoading,
    fetchUserPets
  };
};
