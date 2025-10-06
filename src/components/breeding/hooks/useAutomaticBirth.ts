
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateLitterBabies } from "../BabyGenerator";

export const useAutomaticBirth = (breedingPairs: any[]) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAutomaticBirths = async () => {
    if (!breedingPairs || breedingPairs.length === 0) return;
    
    // Reentrancy guard
    if (isProcessing) return;
    
    const now = new Date();
    
    // Find pairs ready to give birth (not born yet, past birth date)
    const readyToGiveBirth = breedingPairs.filter(pair => {
      const birthDate = new Date(pair.birth_date);
      return !pair.is_born && now >= birthDate;
    });

    // Find pairs that are born but might be missing babies (repair pass)
    const bornButMissingBabies = breedingPairs.filter(pair => {
      const birthDate = new Date(pair.birth_date);
      return pair.is_born && now >= birthDate && !pair.is_completed;
    });

    if (readyToGiveBirth.length === 0 && bornButMissingBabies.length === 0) {
      return;
    }

    setIsProcessing(true);
    let didMutate = false;

    try {
      // Process normal births first
      for (const pair of readyToGiveBirth) {
        const mutated = await processBirth(pair);
        if (mutated) didMutate = true;
      }

      // Process repair candidates
      for (const pair of bornButMissingBabies) {
        // Check if babies already exist
        const { data: existingBabies } = await supabase
          .from("litter_babies")
          .select("id")
          .eq("breeding_pair_id", pair.id);
        
        if (!existingBabies || existingBabies.length === 0) {
          const mutated = await processBirth(pair, true);
          if (mutated) didMutate = true;
        }
      }

      // Only dispatch update event if we actually mutated data
      if (didMutate) {
        window.dispatchEvent(new CustomEvent('breeding-update'));
      }
      
    } finally {
      setIsProcessing(false);
    }
  };

  const processBirth = async (pair: any, isRepair: boolean = false): Promise<boolean> => {
    try {
      // Check if babies already exist
      const { data: existingBabies } = await supabase
        .from("litter_babies")
        .select("id")
        .eq("breeding_pair_id", pair.id);
      
      if (existingBabies && existingBabies.length > 0 && !isRepair) {
        // Just mark as born if babies already exist
        if (!pair.is_born) {
          const { error } = await supabase
            .from("breeding_pairs")
            .update({ is_born: true })
            .eq("id", pair.id);
            
          if (error) {
            console.error(`❌ Auto-birth: Failed to mark litter ${pair.litter_number} as born:`, error);
            return false;
          }
          return true; // We mutated data
        }
        return false; // No mutation needed
      }
      
      // Get parent data for baby generation
      const { data: parent1 } = await supabase
        .from("user_pets")
        .select("*, pets(*)")
        .eq("id", pair.parent1_id)
        .single();
        
      const { data: parent2 } = await supabase
        .from("user_pets")
        .select("*, pets(*)")
        .eq("id", pair.parent2_id)
        .single();
      
      if (!parent1 || !parent2) {
        console.error(`❌ Auto-birth: Missing parent data for litter ${pair.litter_number}`);
        return false;
      }
      
      // Generate babies using the BabyGenerator directly
      await generateLitterBabies(pair, parent1, parent2, (options) => {
        // Silent toast for auto-birth
      });
      
      // Ensure the pair is marked as born
      if (!pair.is_born) {
        await supabase
          .from("breeding_pairs")
          .update({ is_born: true })
          .eq("id", pair.id);
      }
      
      return true; // We mutated data
    } catch (error) {
      console.error(`❌ Auto-birth: Failed to birth litter ${pair.litter_number}:`, error);
      return false;
    }
  };

  useEffect(() => {
    if (breedingPairs && breedingPairs.length > 0) {
      processAutomaticBirths();
    }
  }, [breedingPairs]);

  return { isProcessing };
};
