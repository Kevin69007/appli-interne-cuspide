
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDailyXP } from "@/hooks/useDailyXP";
import { recordXPTransaction } from "@/utils/transactionUtils";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { canWaterOtherUserPets } from "@/utils/feedingPermissionHelpers";
import { recentPetInteractions } from "@/state/recentPetInteractions";

export const useWaterOtherUserPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkAndAwardXP } = useDailyXP();
  const [watering, setWatering] = useState<Set<string>>(new Set());

  const waterOtherUserPet = async (petId: string, currentWater: number): Promise<void> => {
    if (!user?.id || watering.has(petId)) {
      console.log("Water blocked - No user or already watering pet:", petId);
      return;
    }

    console.log("Starting water process for other user's pet:", petId);

    setWatering(prev => new Set([...prev, petId]));
    
    try {
      // Step 1: Get pet data
      const { data: petData, error: petFetchError } = await supabase
        .from("user_pets")
        .select("water, pet_name, user_id, last_watered")
        .eq("id", petId)
        .single();

      if (petFetchError || !petData) {
        console.error("Pet fetch error:", petFetchError);
        throw new Error("Pet not found or access denied");
      }

      console.log("Pet data loaded:", {
        petName: petData.pet_name,
        userId: petData.user_id
      });

      // Step 2: Get the pet owner's feeding privacy setting
      const { data: ownerProfile, error: profileError } = await supabase
        .from("profiles")
        .select("feeding_privacy")
        .eq("id", petData.user_id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Unable to verify watering permissions");
      }

      // Step 3: Check watering permissions
      const feedingPrivacy = ownerProfile?.feeding_privacy || 'user_only';
      const permissionCheck = await canWaterOtherUserPets(user.id, petData.user_id, feedingPrivacy);
      
      if (!permissionCheck.canWater) {
        toast({
          title: "Cannot water pet",
          description: permissionCheck.reason,
          variant: "destructive",
        });
        return;
      }

      // Calculate current water level based on time decay
      const petWithCurrentStats = calculateCurrentStats(petData);
      const currentWaterLevel = Math.max(0, petWithCurrentStats.water);

      console.log("Pet water status:", {
        petName: petData.pet_name,
        storedWater: petData.water,
        currentWater: currentWaterLevel,
        lastWatered: petData.last_watered
      });

      // Check if pet needs watering
      if (currentWaterLevel >= 100) {
        toast({
          title: "Pet is already hydrated",
          description: `${petData.pet_name} is already fully hydrated and doesn't need water right now`,
          variant: "destructive",
        });
        return;
      }

      // Step 4: Update pet water and last_watered timestamp
      const { error: petError } = await supabase
        .from("user_pets")
        .update({
          water: 100,
          last_watered: new Date().toISOString()
        })
        .eq("id", petId);

      if (petError) {
        console.error("Pet update error:", petError);
        throw new Error("Failed to update pet water level");
      }

      console.log("Pet water updated successfully to 100%");

      // Mark as recently watered to keep UI at 100% without refresh
      recentPetInteractions.markWatered(petId);

      // Step 5: Get current profile data and update rewards (NO water bag deduction)
      const { data: currentProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("paw_points")
        .eq("id", user.id)
        .single();

      if (profileFetchError || !currentProfile) {
        console.error("Profile fetch error:", profileFetchError);
        throw new Error("Failed to load your profile");
      }

      // Step 6: Award EXACTLY 10 paw points
      const PAW_POINTS_REWARD = 10;
      const currentPawPoints = currentProfile.paw_points || 0;
      const newPawPoints = currentPawPoints + PAW_POINTS_REWARD;

      const { error: profileError2 } = await supabase
        .from("profiles")
        .update({ 
          paw_points: newPawPoints
        })
        .eq("id", user.id);

      if (profileError2) {
        console.error("Profile update error:", profileError2);
        throw new Error("Failed to update rewards");
      }

      console.log("Profile updated - Paw points:", newPawPoints);

      // Step 7: Record transaction
      try {
        const { error: transactionError } = await supabase
          .from("pet_transactions")
          .insert({
            user_id: user.id,
            pet_id: petId,
            paw_points: PAW_POINTS_REWARD,
            description: `Watered ${petData.pet_name} (another user's pet)`
          });

        if (transactionError) {
          console.error("Transaction error:", transactionError);
        } else {
          console.log("Paw points transaction recorded");
        }
      } catch (ledgerError) {
        console.error("Ledger recording error:", ledgerError);
      }

      // Step 8: Award EXACTLY 10 XP
      const XP_REWARD = 10;
      let xpResult: { success: boolean; xpAwarded: number; reason?: string } = { success: false, xpAwarded: 0 };
      try {
        xpResult = await checkAndAwardXP(XP_REWARD, "watering a pet");
        
        if (xpResult.success && xpResult.xpAwarded > 0) {
          await recordXPTransaction(
            user.id,
            xpResult.xpAwarded,
            'pet_water_other',
            `Watered ${petData.pet_name} (another user's pet)`
          );
          console.log("XP awarded and recorded:", xpResult.xpAwarded);
        }
      } catch (xpError) {
        console.error("XP processing failed:", xpError);
      }

      // Step 9: Success feedback - clean toast without emojis
      let toastMessage = `${petData.pet_name} is now hydrated and happy`;
      let toastDescription = `+${PAW_POINTS_REWARD} Paw Points`;

      if (xpResult.success && xpResult.xpAwarded > 0) {
        toastDescription += `, +${xpResult.xpAwarded} XP earned`;
      }

      toast({
        title: toastMessage,
        description: toastDescription,
        duration: 4000,
      });

      console.log("Water completed successfully!");

    } catch (error) {
      console.error("Error watering pet:", error);
      toast({
        title: "Watering Failed", 
        description: error instanceof Error ? error.message : "Failed to water pet",
        variant: "destructive",
      });
    } finally {
      setWatering(prev => {
        const newSet = new Set(prev);
        newSet.delete(petId);
        return newSet;
      });
    }
  };

  const isWatering = (petId: string) => watering.has(petId);

  return { waterOtherUserPet, isWatering };
};
