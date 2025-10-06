
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDailyXP } from "@/hooks/useDailyXP";
import { recordXPTransaction } from "@/utils/transactionUtils";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { canWaterOtherUserPets } from "@/utils/feedingPermissionHelpers";
import { recentPetInteractions } from "@/state/recentPetInteractions";

export const useUnifiedBulkWaterPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAndAwardXP } = useDailyXP();
  const [bulkWatering, setBulkWatering] = useState<Set<string>>(new Set());

  const bulkWaterPets = async (
    targetUserId: string, 
    isOwnPets: boolean = true,
    targetProfile?: any
  ): Promise<{ success: boolean; wateredCount?: number }> => {
    if (!user || bulkWatering.has(targetUserId)) {
      return { success: false };
    }

    console.log(`💧 UNIFIED BULK WATER START: ${isOwnPets ? 'Own pets' : 'Other user pets'} for ${targetUserId}`);
    setBulkWatering(prev => new Set([...prev, targetUserId]));

    try {
      // Step 1: Permission check for other users' pets
      if (!isOwnPets && targetProfile) {
        const feedingPrivacy = targetProfile.feeding_privacy || 'user_only';
        const permissionCheck = await canWaterOtherUserPets(user.id, targetUserId, feedingPrivacy);
        
        if (!permissionCheck.canWater) {
          throw new Error(permissionCheck.reason || "Permission denied");
        }
      }

      // Step 2: Get user's profile for paw points
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_points")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error("Failed to load user profile");
      }

      // Step 3: Get all pets for the target user
      const { data: pets, error: petsError } = await supabase
        .from("user_pets")
        .select("id, pet_name, hunger, water, last_fed, last_watered, user_id")
        .eq("user_id", targetUserId);

      if (petsError || !pets) {
        throw new Error("Failed to fetch pets");
      }

      if (pets.length === 0) {
        throw new Error("No pets found");
      }

      // Step 4: Filter pets that need watering
      const petsWithCurrentStats = pets.map(calculateCurrentStats);
      const petsToWater = petsWithCurrentStats.filter(pet => pet.water < 100);
      
      if (petsToWater.length === 0) {
        toast({
          title: "All pets are well hydrated",
          description: `All ${pets.length} pets already have full water.`,
        });
        return { success: true, wateredCount: 0 };
      }

      // Step 5: Update all pets at once
      const waterTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("user_pets")
        .update({
          water: 100,
          last_watered: waterTimestamp
        })
        .eq("user_id", targetUserId)
        .in("id", petsToWater.map(pet => pet.id));

      if (updateError) {
        console.error("❌ Bulk water update error:", updateError);
        throw new Error("Failed to water pets");
      }

      console.log(`✅ Bulk watered ${petsToWater.length} pets to 100% with timestamp ${waterTimestamp}`);

      // Mark pets as recently watered for sticky 100% UI
      petsToWater.forEach((pet) => recentPetInteractions.markWatered(pet.id));

      // Step 6: Update user profile - consistent 10 paw points per pet
      const PAW_POINTS_PER_PET = 10;
      const totalPawPoints = petsToWater.length * PAW_POINTS_PER_PET;
      const newPawPoints = userProfile.paw_points + totalPawPoints;

      let profileUpdateData: any = {
        paw_points: newPawPoints
      };

      // Only update care date for own pets
      if (isOwnPets) {
        profileUpdateData.last_care_date = new Date().toISOString().split('T')[0];
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("❌ Profile update error:", profileUpdateError);
        throw new Error("Failed to update profile");
      }

      // Step 7: Record transactions
      const transactionPromises = petsToWater.map(pet => 
        supabase
          .from("pet_transactions")
          .insert({
            user_id: user.id,
            pet_id: pet.id,
            paw_points: PAW_POINTS_PER_PET,
            description: `Watered ${pet.pet_name}${!isOwnPets ? ' (another user\'s pet)' : ''}`
          })
      );

      await Promise.all(transactionPromises);

      // Step 8: Award XP - consistent 10 XP per pet
      const XP_PER_PET = 10;
      const totalXP = petsToWater.length * XP_PER_PET;
      let xpAwarded = 0;

      try {
        const xpResult = await checkAndAwardXP(totalXP, isOwnPets ? "watering all pets" : "watering other user's pets");
        if (xpResult.success && xpResult.xpAwarded > 0) {
          xpAwarded = xpResult.xpAwarded;
          await recordXPTransaction(
            user.id,
            xpAwarded,
            'pet_bulk_water',
            `Bulk watered ${petsToWater.length} pets${isOwnPets ? '' : ' (other user)'}`
          );
        }
      } catch (xpError) {
        console.error("XP processing failed:", xpError);
      }

      // Step 9: Success toast
      let toastDescription = `Successfully watered ${petsToWater.length} pets, earned ${totalPawPoints} paw points`;
      
      if (xpAwarded > 0) {
        toastDescription += ` and gained ${xpAwarded} XP!`;
      }

      const wellHydratedCount = pets.length - petsToWater.length;
      if (wellHydratedCount > 0) {
        toastDescription += `. ${wellHydratedCount} pets were already well-hydrated.`;
      }

      toast({
        title: isOwnPets ? "All pets watered!" : `Watered ${petsToWater.length} pets`,
        description: toastDescription,
      });

      // Invalidate caches for immediate refresh
      queryClient.invalidateQueries({ queryKey: ["userPets"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      return { success: true, wateredCount: petsToWater.length };

    } catch (error: any) {
      console.error("❌ UNIFIED BULK WATER ERROR:", error);
      
      toast({
        title: "Watering Failed",
        description: error.message || "Failed to water pets",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setBulkWatering(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const isBulkWatering = (targetUserId: string) => bulkWatering.has(targetUserId);

  return { bulkWaterPets, isBulkWatering };
};
