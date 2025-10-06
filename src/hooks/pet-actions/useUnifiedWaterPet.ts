import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { useDailyXP } from "@/hooks/useDailyXP";
import { recordXPTransaction } from "@/utils/transactionUtils";
import { recentPetInteractions } from "@/state/recentPetInteractions";

interface WaterPetResult {
  success: boolean;
  error?: string;
  newStats?: {
    hunger: number;
    water: number;
  };
}

export const useUnifiedWaterPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAndAwardXP } = useDailyXP();
  const [wateringPets, setWateringPets] = useState<Set<string>>(new Set());

  const waterPet = async (petId: string): Promise<WaterPetResult> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to water pets.",
        variant: "destructive",
        duration: 3000,
      });
      return { success: false, error: "Not authenticated" };
    }

    // Set watering state IMMEDIATELY and keep it for consistent UI feedback
    setWateringPets(prev => new Set(prev).add(petId));
    console.log(`🔄 WATERING STATE SET for pet ${petId}`);

    try {
      console.log(`💧 Starting water operation for pet ${petId}`);

      const { data: currentPet, error: petError } = await supabase
        .from("user_pets")
        .select("hunger, water, last_watered, user_id")
        .eq("id", petId)
        .single();

      if (petError || !currentPet) {
        throw new Error(`Pet not found: ${petError?.message}`);
      }

      const isOwnPet = currentPet.user_id === user.id;
      console.log(`🔍 Pet ownership: ${isOwnPet ? 'Own pet' : 'Friend\'s pet'}`);

      const currentStats = calculateCurrentStats(currentPet);
      if (currentStats.water >= 100) {
        toast({
          title: "Pet Already Hydrated",
          description: "This pet doesn't need water right now!",
          duration: 3000,
        });
        return { success: false, error: "Pet already hydrated" };
      }

      const { error: updateError } = await supabase
        .from("user_pets")
        .update({
          water: 100,
          last_watered: new Date().toISOString(),
        })
        .eq("id", petId);

      if (updateError) {
        throw new Error(`Failed to update pet: ${updateError.message}`);
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_points")
        .eq("id", user.id)
        .single();

      if (profileError || !currentProfile) {
        throw new Error("Failed to fetch profile for watering rewards");
      }

      const newPawPoints = currentProfile.paw_points + 10;

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          paw_points: newPawPoints
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        throw new Error("Failed to update watering rewards");
      }

      try {
        const xpResult = await checkAndAwardXP(10, isOwnPet ? "watering pet" : "watering other user pet");
        if (xpResult.success && xpResult.xpAwarded > 0) {
          await recordXPTransaction(
            user.id,
            xpResult.xpAwarded,
            isOwnPet ? 'pet_water' : 'pet_water_other',
            isOwnPet ? 'Watered own pet' : 'Watered another user\'s pet'
          );
        }
      } catch (xpError) {
        console.error("XP processing failed:", xpError);
      }

      await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: petId,
          paw_points: 10,
          description: isOwnPet ? "Watered pet" : "Watered another user's pet"
        });

      toast({
        title: "Pet Watered Successfully! 💧",
        description: "Earned 10 XP and 10 Paw Points!",
        duration: 4000,
      });

console.log(`✅ Pet watered successfully`);

// Mark as recently watered to keep UI at 100% without refresh
recentPetInteractions.markWatered(petId);

// Immediate data refresh for pet profile
queryClient.invalidateQueries({ queryKey: ["userPets"] });
queryClient.invalidateQueries({ queryKey: ["profile"] });
queryClient.invalidateQueries({ queryKey: ["petProfile", petId] });

      return { 
        success: true,
        newStats: {
          hunger: currentPet.hunger,
          water: 100
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("❌ Water pet operation failed:", errorMessage);
      
      toast({
        title: "Watering Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
      
      return { success: false, error: errorMessage };
    } finally {
      // CRITICAL: Keep watering state for EXACTLY 1000ms to guarantee animation completion
      setTimeout(() => {
        setWateringPets(prev => {
          const newSet = new Set(prev);
          newSet.delete(petId);
          return newSet;
        });
      }, 1000);
    }
  };

  const isWatering = (petId: string) => wateringPets.has(petId);

  return { waterPet, isWatering };
};
