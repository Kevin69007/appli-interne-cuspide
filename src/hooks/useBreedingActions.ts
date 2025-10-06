
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useBreedingActions = () => {
  const { toast } = useToast();
  const [collecting, setCollecting] = useState(false);

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

  return {
    collectBabies,
    collecting
  };
};
