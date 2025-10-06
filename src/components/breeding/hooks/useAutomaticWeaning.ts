
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAutomaticWeaning = (breedingPairs: any[]) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processAutomaticWeaning = async () => {
    if (!breedingPairs || breedingPairs.length === 0) return;
    
    // Reentrancy guard
    if (isProcessing) return;
    
    console.log("🔄 Client-side weaning fallback: Checking for litters ready to wean");
    
    const now = new Date();
    // Get current date at 00:00 for comparison
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const readyToWean = breedingPairs.filter(pair => {
      if (!pair.is_born || pair.is_weaned) return false;
      
      const weanDate = new Date(pair.wean_date);
      weanDate.setHours(0, 0, 0, 0); // Normalize to 00:00 for comparison
      
      return currentDate >= weanDate;
    });

    if (readyToWean.length === 0) {
      console.log("🔄 Client-side weaning fallback: No litters ready to wean");
      return;
    }

    console.log(`🔄 Client-side weaning fallback: Found ${readyToWean.length} litters ready to wean (server may have already processed these)`);

    setIsProcessing(true);
    let didMutate = false;

    try {
      for (const pair of readyToWean) {
        try {
          // Set exact wean time to 12:00 AM of the current day (consistent with server-side)
          const exactWeanTime = new Date();
          exactWeanTime.setHours(0, 0, 0, 0);
          
          const { error } = await supabase
            .from("breeding_pairs")
            .update({ 
              wean_date: exactWeanTime.toISOString(),
              is_weaned: true 
            })
            .eq("id", pair.id)
            .eq("is_weaned", false); // Only update if not already weaned (prevents race conditions)

          if (error) {
            console.error(`❌ Client-side weaning fallback: Failed to wean litter ${pair.litter_number}:`, error);
          } else {
            console.log(`✅ Client-side weaning fallback: Successfully weaned litter ${pair.litter_number} as fallback`);
            didMutate = true;
          }
        } catch (error) {
          console.error(`❌ Client-side weaning fallback: Failed to wean litter ${pair.litter_number}:`, error);
        }
      }

      // Only dispatch breeding-update if we actually mutated data
      if (didMutate) {
        console.log("🔄 Client-side weaning fallback: Dispatching breeding-update event");
        window.dispatchEvent(new CustomEvent('breeding-update'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (breedingPairs && breedingPairs.length > 0) {
      processAutomaticWeaning();
    }
  }, [breedingPairs]);

  return { isProcessing };
};
