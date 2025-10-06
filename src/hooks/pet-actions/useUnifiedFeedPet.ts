import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { useDailyXP } from "@/hooks/useDailyXP";
import { recordXPTransaction } from "@/utils/transactionUtils";
import { recentPetInteractions } from "@/state/recentPetInteractions";

interface FeedPetResult {
  success: boolean;
  error?: string;
  newStats?: {
    hunger: number;
    water: number;
  };
}

export const useUnifiedFeedPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAndAwardXP } = useDailyXP();
  const [feedingPets, setFeedingPets] = useState<Set<string>>(new Set());

  const feedPet = async (petId: string): Promise<FeedPetResult> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to feed pets.",
        variant: "destructive",
        duration: 3000,
      });
      return { success: false, error: "Not authenticated" };
    }

    // Set feeding state IMMEDIATELY and keep it for consistent UI feedback
    setFeedingPets(prev => new Set(prev).add(petId));
    console.log(`🔄 FEEDING STATE SET for pet ${petId}`);

    try {
      console.log(`🍖 Starting feed operation for pet ${petId}`);

      const { data: currentPet, error: petError } = await supabase
        .from("user_pets")
        .select("hunger, water, last_fed, user_id")
        .eq("id", petId)
        .single();

      if (petError || !currentPet) {
        throw new Error(`Pet not found: ${petError?.message}`);
      }

      const isOwnPet = currentPet.user_id === user.id;
      console.log(`🔍 Pet ownership: ${isOwnPet ? 'Own pet' : 'Friend\'s pet'}`);

      if (isOwnPet) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("food_bags")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("Failed to check food supply");
        }

        if (profile.food_bags <= 0) {
          toast({
            title: "No Food Bags",
            description: "You need food bags to feed your pet!",
            variant: "destructive",
            duration: 3000,
          });
          return { success: false, error: "No food bags" };
        }
      }

      const currentStats = calculateCurrentStats(currentPet);
      if (currentStats.hunger >= 100) {
        toast({
          title: "Pet Already Fed",
          description: "This pet doesn't need food right now!",
          duration: 3000,
        });
        return { success: false, error: "Pet already fed" };
      }

      const { error: updateError } = await supabase
        .from("user_pets")
        .update({
          hunger: 100,
          last_fed: new Date().toISOString(),
        })
        .eq("id", petId);

      if (updateError) {
        throw new Error(`Failed to update pet: ${updateError.message}`);
      }

      const { data: currentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_points, food_bags")
        .eq("id", user.id)
        .single();

      if (profileError || !currentProfile) {
        throw new Error("Failed to fetch profile for feeding rewards");
      }

      let updateData: any = {
        paw_points: currentProfile.paw_points + 10
      };

      if (isOwnPet) {
        updateData.food_bags = Math.max(0, currentProfile.food_bags - 1);
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (profileUpdateError) {
        throw new Error("Failed to update feeding rewards");
      }

      try {
        const xpResult = await checkAndAwardXP(10, isOwnPet ? "feeding pet" : "feeding other user pet");
        if (xpResult.success && xpResult.xpAwarded > 0) {
          await recordXPTransaction(
            user.id,
            xpResult.xpAwarded,
            isOwnPet ? 'pet_feed' : 'pet_feed_other',
            isOwnPet ? 'Fed own pet' : 'Fed another user\'s pet'
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
          description: isOwnPet ? "Fed pet" : "Fed another user's pet"
        });

      toast({
        title: "Pet Fed Successfully! 🍖",
        description: "Earned 10 XP and 10 Paw Points!",
        duration: 4000,
      });

console.log(`✅ Pet fed successfully`);

// Mark as recently fed to keep UI at 100% without refresh
recentPetInteractions.markFed(petId);

// Immediate data refresh for pet profile
queryClient.invalidateQueries({ queryKey: ["userPets"] });
queryClient.invalidateQueries({ queryKey: ["profile"] });
queryClient.invalidateQueries({ queryKey: ["petProfile", petId] });

      return { 
        success: true,
        newStats: {
          hunger: 100,
          water: currentPet.water
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("❌ Feed pet operation failed:", errorMessage);
      
      toast({
        title: "Feeding Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
      
      return { success: false, error: errorMessage };
    } finally {
      // CRITICAL: Keep feeding state for EXACTLY 1000ms to guarantee animation completion
      setTimeout(() => {
        setFeedingPets(prev => {
          const newSet = new Set(prev);
          newSet.delete(petId);
          return newSet;
        });
      }, 1000);
    }
  };

  const isFeeding = (petId: string) => feedingPets.has(petId);

  return { feedPet, isFeeding };
};
