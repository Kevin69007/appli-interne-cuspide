
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateLitterBabies } from "../BabyGenerator";

export const useBreedingActions = () => {
  const { toast } = useToast();
  const [collecting, setCollecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const collectBabies = async (breedingPairId: string, userId: string) => {
    setCollecting(true);
    try {
      console.log("🍼 Starting baby collection with preserved stats for pair:", breedingPairId);

      // Call the edge function to collect babies with preserved stats
      const { data, error } = await supabase.functions.invoke('collect-breeding-babies', {
        body: {
          breeding_pair_id: breedingPairId,
          user_id: userId
        }
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        toast({
          title: "Collection Failed",
          description: error.message || "Failed to collect babies. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (!data.success) {
        console.error("❌ Collection failed:", data.error);
        toast({
          title: "Collection Failed",
          description: data.error || "Failed to collect babies. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      console.log("✅ Baby collection successful:", data);
      toast({
        title: "Babies Collected!",
        description: data.message || `Successfully collected ${data.babies_transferred || 0} babies`,
      });

      return true;
    } catch (error) {
      console.error("❌ Collection error:", error);
      toast({
        title: "Collection Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setCollecting(false);
    }
  };

  const generateBabies = async (
    breedingPair: any,
    mother: any,
    father: any,
    toastCallback: (options: { title: string; description: string; variant?: "destructive" }) => void
  ) => {
    setIsGenerating(true);
    try {
      const result = await generateLitterBabies(breedingPair, mother, father, toastCallback);
      return result;
    } catch (error) {
      console.error("❌ Error in generateBabies:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const accelerateBreeding = async (breedingPairId: string) => {
    const now = new Date();
    
    // Calculate wean date as 14 days from birth, but set to 00:00 of that day
    const weanDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    weanDate.setHours(0, 0, 0, 0); // Set to 00:00 of the wean day
    
    const { error } = await supabase
      .from("breeding_pairs")
      .update({ 
        birth_date: now.toISOString(),
        wean_date: weanDate.toISOString(),
        is_born: true 
      })
      .eq("id", breedingPairId);

    if (error) {
      console.error("❌ Error accelerating breeding:", error);
      throw error;
    }

    return true;
  };

  const accelerateWeaning = async (breedingPairId: string) => {
    // Set wean date to 00:00 of current day
    const weanDate = new Date();
    weanDate.setHours(0, 0, 0, 0);
    
    const { error } = await supabase
      .from("breeding_pairs")
      .update({ 
        wean_date: weanDate.toISOString(),
        is_weaned: true 
      })
      .eq("id", breedingPairId);

    if (error) {
      console.error("❌ Error accelerating weaning:", error);
      throw error;
    }

    return true;
  };

  return {
    collectBabies,
    collecting,
    generateBabies,
    isGenerating,
    accelerateBreeding,
    accelerateWeaning
  };
};
