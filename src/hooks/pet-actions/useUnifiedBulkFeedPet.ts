
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useDailyXP } from "@/hooks/useDailyXP";
import { recordXPTransaction } from "@/utils/transactionUtils";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { canFeedOtherUserPets, validateUserHasResources } from "@/utils/feedingPermissionHelpers";
import { getUserPetsForBulkAction } from "@/utils/bulkPetActionHelpers";
import { recentPetInteractions } from "@/state/recentPetInteractions";

export const useUnifiedBulkFeedPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkAndAwardXP } = useDailyXP();
  const [bulkFeeding, setBulkFeeding] = useState<Set<string>>(new Set());

  const bulkFeedPets = async (
    targetUserId: string, 
    isOwnPets: boolean = true, 
    targetProfile?: any
  ): Promise<{ success: boolean; fedCount?: number; reason?: string }> => {
    if (!user?.id || bulkFeeding.has(targetUserId)) {
      return { success: false, reason: "Already feeding pets for this user" };
    }

    console.log(`🍖 Starting bulk feed for ${isOwnPets ? 'own' : 'other'} pets`, {
      targetUserId,
      currentUserId: user.id
    });

    // Get current user's profile for resource validation
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("food_bags, paw_points")
      .eq("id", user.id)
      .single();

    if (profileError || !currentProfile) {
      console.error("Profile fetch error:", profileError);
      return { success: false, reason: "Failed to load your profile" };
    }

    // For other users' pets, don't check food bags (they're not consumed)
    if (isOwnPets) {
      const resourceCheck = validateUserHasResources(currentProfile, 'feed');
      if (!resourceCheck.hasResources) {
        toast({
          title: "Cannot feed pets",
          description: resourceCheck.reason,
          variant: "destructive",
        });
        return { success: false, reason: resourceCheck.reason };
      }
    }

    // If feeding other user's pets, check permissions
    if (!isOwnPets && targetProfile) {
      const feedingPrivacy = targetProfile.feeding_privacy || 'user_only';
      const permissionCheck = await canFeedOtherUserPets(user.id, targetUserId, feedingPrivacy);
      
      if (!permissionCheck.canFeed) {
        toast({
          title: "Cannot feed pets",
          description: permissionCheck.reason,
          variant: "destructive",
        });
        return { success: false, reason: permissionCheck.reason };
      }
    }

    setBulkFeeding(prev => new Set([...prev, targetUserId]));

    try {
      // Get pets that need feeding
      const pets = await getUserPetsForBulkAction(targetUserId, 'feed');
      const petsNeedingFood: any[] = [];

      for (const pet of pets) {
        const petWithCurrentStats = calculateCurrentStats(pet);
        const currentHunger = Math.max(0, petWithCurrentStats.hunger);
        
        if (currentHunger < 100) {
          petsNeedingFood.push(pet);
        }
      }

      if (petsNeedingFood.length === 0) {
        toast({
          title: "All pets are full",
          description: "No pets need feeding right now",
          variant: "destructive",
        });
        return { success: false, reason: "No pets need feeding" };
      }

      // For own pets, check food bags; for other users' pets, skip this check
      if (isOwnPets) {
        const requiredFoodBags = petsNeedingFood.length;
        if (currentProfile.food_bags < requiredFoodBags) {
          toast({
            title: "Not enough food bags",
            description: `You need ${requiredFoodBags} food bags but only have ${currentProfile.food_bags}. Visit the shop to buy more!`,
            variant: "destructive",
          });
          return { success: false, reason: "Insufficient food bags" };
        }
      }

      console.log(`🍖 Feeding ${petsNeedingFood.length} pets`);

      // Update all pets at once
      const petIds = petsNeedingFood.map(pet => pet.id);
      const { error: petUpdateError } = await supabase
        .from("user_pets")
        .update({
          hunger: 100,
          last_fed: new Date().toISOString()
        })
        .in("id", petIds);

      if (petUpdateError) {
        console.error("Pet update error:", petUpdateError);
        throw new Error("Failed to update pets");
      }

      // Mark pets as recently fed for sticky 100% UI
      petIds.forEach((id) => recentPetInteractions.markFed(id));

      // Calculate rewards - consistent 10 paw points per pet for both own and other users' pets
      const PAW_POINTS_PER_PET = 10;
      const totalPawPoints = petsNeedingFood.length * PAW_POINTS_PER_PET;
      const newPawPoints = currentProfile.paw_points + totalPawPoints;

      // Update user profile - only consume food bags for own pets
      let profileUpdateData: any = {
        paw_points: newPawPoints
      };

      if (isOwnPets) {
        const newFoodBags = currentProfile.food_bags - petsNeedingFood.length;
        profileUpdateData.food_bags = newFoodBags;
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError);
        throw new Error("Failed to update rewards");
      }

      console.log(`🍖 Profile updated - Paw points: +${totalPawPoints}${isOwnPets ? `, Food bags consumed: ${petsNeedingFood.length}` : ''}`);

      // Record transactions
      for (const pet of petsNeedingFood) {
        await supabase.from("pet_transactions").insert({
          user_id: user.id,
          pet_id: pet.id,
          paw_points: PAW_POINTS_PER_PET,
          description: isOwnPets ? "Fed pet (bulk)" : `Fed ${pet.pet_name} (another user's pet, bulk)`
        });
      }

      // Award XP - consistent 10 XP per pet
      const XP_PER_PET = 10;
      const totalXP = petsNeedingFood.length * XP_PER_PET;
      let xpAwarded = 0;

      try {
        const xpResult = await checkAndAwardXP(totalXP, "bulk feeding pets");
        if (xpResult.success && xpResult.xpAwarded > 0) {
          xpAwarded = xpResult.xpAwarded;
          await recordXPTransaction(
            user.id,
            xpAwarded,
            'pet_bulk_feed',
            `Bulk fed ${petsNeedingFood.length} pets${isOwnPets ? '' : ' (other user)'}`
          );
        }
      } catch (xpError) {
        console.error("XP processing failed:", xpError);
      }

      // Success toast
      let toastTitle = `Fed ${petsNeedingFood.length} pet${petsNeedingFood.length > 1 ? 's' : ''}!`;
      let toastDescription = `+${totalPawPoints} Paw Points`;
      
      if (isOwnPets) {
        toastDescription += `, -${petsNeedingFood.length} Food Bag${petsNeedingFood.length > 1 ? 's' : ''}`;
      }
      
      if (xpAwarded > 0) {
        toastDescription += `, +${xpAwarded} XP earned`;
      }

      toast({
        title: toastTitle,
        description: toastDescription,
        duration: 4000,
      });

      // Invalidate caches for immediate refresh
      queryClient.invalidateQueries({ queryKey: ["userPets"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      return { success: true, fedCount: petsNeedingFood.length };

    } catch (error) {
      console.error("Bulk feeding error:", error);
      toast({
        title: "Bulk feeding failed",
        description: error instanceof Error ? error.message : "Failed to feed pets",
        variant: "destructive",
      });
      return { success: false, reason: "Bulk feeding failed" };
    } finally {
      setBulkFeeding(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

  const isBulkFeeding = (targetUserId: string) => bulkFeeding.has(targetUserId);

  return { bulkFeedPets, isBulkFeeding };
};
