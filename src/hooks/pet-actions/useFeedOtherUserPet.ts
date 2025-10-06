
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDailyXP } from "@/hooks/useDailyXP";
import { recordXPTransaction } from "@/utils/transactionUtils";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { canFeedOtherUserPets, validateUserHasResources } from "@/utils/feedingPermissionHelpers";
import { recentPetInteractions } from "@/state/recentPetInteractions";

interface UserProfile {
  id: string;
  paw_points: number;
  food_bags: number;
  username?: string;
  feeding_privacy?: string;
}

export const useFeedOtherUserPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkAndAwardXP } = useDailyXP();
  const [feeding, setFeeding] = useState<Set<string>>(new Set());

  const feedOtherUserPet = async (petId: string, userProfile: UserProfile): Promise<void> => {
    if (!user?.id || !userProfile || feeding.has(petId)) {
      console.log("Feed blocked - No user, no profile, or already feeding pet:", petId);
      return;
    }

    console.log("Starting feed process for other user's pet:", petId, userProfile);

    // Get current profile data for most up-to-date food bag count
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("paw_points, food_bags")
      .eq("id", user.id)
      .single();

    if (profileFetchError || !currentProfile) {
      console.error("Profile fetch error:", profileFetchError);
      toast({
        title: "Cannot feed pet",
        description: "Failed to load your profile",
        variant: "destructive",
      });
      return;
    }

    // Validate user has resources with current profile data
    const resourceCheck = validateUserHasResources(currentProfile, 'feed');
    if (!resourceCheck.hasResources) {
      toast({
        title: "Cannot feed pet",
        description: resourceCheck.reason,
        variant: "destructive",
      });
      return;
    }

    setFeeding(prev => new Set([...prev, petId]));
    
    try {
      // Step 1: Get pet data
      const { data: petData, error: petFetchError } = await supabase
        .from("user_pets")
        .select("hunger, pet_name, user_id, last_fed")
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
        throw new Error("Unable to verify feeding permissions");
      }

      // Step 3: Check feeding permissions
      const feedingPrivacy = ownerProfile?.feeding_privacy || 'user_only';
      const permissionCheck = await canFeedOtherUserPets(user.id, petData.user_id, feedingPrivacy);
      
      if (!permissionCheck.canFeed) {
        toast({
          title: "Cannot feed pet",
          description: permissionCheck.reason,
          variant: "destructive",
        });
        return;
      }

      // Calculate current hunger level based on time decay
      const petWithCurrentStats = calculateCurrentStats(petData);
      const currentHunger = Math.max(0, petWithCurrentStats.hunger);

      console.log("Pet hunger status:", {
        petName: petData.pet_name,
        storedHunger: petData.hunger,
        currentHunger: currentHunger,
        lastFed: petData.last_fed
      });

      // Check if pet needs feeding
      if (currentHunger >= 100) {
        toast({
          title: "Pet is already full",
          description: `${petData.pet_name} is already full and doesn't need food right now`,
          variant: "destructive",
        });
        return;
      }

      // Step 4: Double-check food bags one more time before proceeding with atomic transaction
      const { data: finalProfile, error: finalProfileError } = await supabase
        .from("profiles")
        .select("paw_points, food_bags")
        .eq("id", user.id)
        .single();

      if (finalProfileError || !finalProfile) {
        console.error("Final profile fetch error:", finalProfileError);
        throw new Error("Failed to verify your current resources");
      }

      if ((finalProfile.food_bags || 0) <= 0) {
        toast({
          title: "No food bags",
          description: "You need food bags to feed pets. Visit the shop to buy some",
          variant: "destructive",
        });
        return;
      }

      console.log("Final resource check passed - Food bags:", finalProfile.food_bags);

      // Step 5: Update pet hunger and last_fed timestamp
      const { error: petError } = await supabase
        .from("user_pets")
        .update({
          hunger: 100,
          last_fed: new Date().toISOString()
        })
        .eq("id", petId);

      if (petError) {
        console.error("Pet update error:", petError);
        throw new Error("Failed to update pet hunger level");
      }

      console.log("Pet hunger updated successfully to 100%");

      // Mark as recently fed to keep UI at 100% without refresh
      recentPetInteractions.markFed(petId);


      // Step 6: Update user profile - EXACTLY 10 paw points and consume 1 food bag
      const PAW_POINTS_REWARD = 10;
      const newFoodBags = finalProfile.food_bags - 1;
      const newPawPoints = finalProfile.paw_points + PAW_POINTS_REWARD;

      const { error: profileError2 } = await supabase
        .from("profiles")
        .update({ 
          food_bags: newFoodBags,
          paw_points: newPawPoints
        })
        .eq("id", user.id);

      if (profileError2) {
        console.error("Profile update error:", profileError2);
        throw new Error("Failed to update rewards");
      }

      console.log("Profile updated - Food bags consumed:", finalProfile.food_bags, "->", newFoodBags, "Paw points:", newPawPoints);

      // Step 7: Record transaction
      try {
        const { error: transactionError } = await supabase
          .from("pet_transactions")
          .insert({
            user_id: user.id,
            pet_id: petId,
            paw_points: PAW_POINTS_REWARD,
            description: `Fed ${petData.pet_name} (another user's pet)`
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
        xpResult = await checkAndAwardXP(XP_REWARD, "feeding a pet");
        
        if (xpResult.success && xpResult.xpAwarded > 0) {
          await recordXPTransaction(
            user.id,
            xpResult.xpAwarded,
            'pet_feed_other',
            `Fed ${petData.pet_name} (another user's pet)`
          );
          console.log("XP awarded and recorded:", xpResult.xpAwarded);
        }
      } catch (xpError) {
        console.error("XP processing failed:", xpError);
      }

      // Step 9: Success feedback - clean toast without emojis
      let toastMessage = `${petData.pet_name} is now full and happy`;
      let toastDescription = `+${PAW_POINTS_REWARD} Paw Points, -1 Food Bag`;

      if (xpResult.success && xpResult.xpAwarded > 0) {
        toastDescription += `, +${xpResult.xpAwarded} XP earned`;
      }

      toast({
        title: toastMessage,
        description: toastDescription,
        duration: 4000,
      });

      console.log("Feed completed successfully!");

    } catch (error) {
      console.error("Error feeding pet:", error);
      toast({
        title: "Feeding Failed", 
        description: error instanceof Error ? error.message : "Failed to feed pet",
        variant: "destructive",
      });
    } finally {
      setFeeding(prev => {
        const newSet = new Set(prev);
        newSet.delete(petId);
        return newSet;
      });
    }
  };

  const isFeeding = (petId: string) => feeding.has(petId);

  return { feedOtherUserPet, isFeeding };
};
