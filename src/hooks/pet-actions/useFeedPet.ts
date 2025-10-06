
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyXP } from "@/hooks/useDailyXP";
import { calculateCurrentStats } from "@/utils/petHelpers";

export const useFeedPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkAndAwardXP } = useDailyXP();
  const [feeding, setFeeding] = useState<Set<string>>(new Set());

  const feedPet = async (petId: string, onSuccess?: () => void): Promise<boolean> => {
    if (!user || feeding.has(petId)) {
      console.log("❌ Feed blocked - No user or already feeding pet:", petId);
      return false;
    }

    setFeeding(prev => new Set([...prev, petId]));
    console.log("🍖 Starting to feed pet:", petId, "for user:", user.id);

    try {
      // Step 1: Get current pet state and verify ownership
      const { data: currentPet, error: petError } = await supabase
        .from("user_pets")
        .select("hunger, user_id, pet_name, last_fed, pet_id, is_for_breeding")
        .eq("id", petId)
        .single();

      if (petError) {
        console.error("❌ Error fetching pet:", petError);
        throw new Error(`Failed to access pet: ${petError.message}`);
      }

      if (!currentPet) {
        throw new Error("Pet not found");
      }

      if (currentPet.user_id !== user.id) {
        throw new Error("You don't own this pet");
      }

      // Step 2: Calculate current hunger level based on time decay
      const petWithCurrentStats = calculateCurrentStats(currentPet);
      const currentHunger = Math.max(0, petWithCurrentStats.hunger);

      console.log("🍖 Pet hunger status:", {
        petName: currentPet.pet_name,
        storedHunger: currentPet.hunger,
        currentHunger: currentHunger,
        lastFed: currentPet.last_fed,
        isForBreeding: currentPet.is_for_breeding
      });

      // Check if pet needs feeding using 100% threshold - can feed anytime under 100%
      if (currentHunger >= 100) {
        throw new Error(`${currentPet.pet_name} doesn't need food right now! They have ${currentHunger}% hunger and are completely full.`);
      }

      // Step 3: Check if user has food bags
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("food_bags, paw_points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError);
        throw new Error(`Failed to check food supply: ${profileError.message}`);
      }

      if (!profile || profile.food_bags <= 0) {
        throw new Error("No food bags available! Visit the shop to buy more.");
      }

      console.log("🍖 Pre-feeding state:", {
        petHunger: currentHunger,
        foodBags: profile.food_bags,
        pawPoints: profile.paw_points
      });

      // Step 4: Update pet hunger to 100%
      const { error: updateError } = await supabase
        .from("user_pets")
        .update({
          hunger: 100,
          last_fed: new Date().toISOString(),
        })
        .eq("id", petId);

      if (updateError) {
        console.error("❌ Error updating pet hunger:", updateError);
        throw new Error(`Failed to feed pet: ${updateError.message}`);
      }

      console.log("✅ Pet hunger updated successfully to 100%");

      // Step 5: Award EXACTLY 10 Paw Points and consume EXACTLY 1 food bag
      const PAW_POINTS_REWARD = 10;
      const FOOD_BAGS_CONSUMED = 1; // FIXED: Always consume exactly 1 bag
      const newPawPoints = Math.max(0, (profile.paw_points || 0)) + PAW_POINTS_REWARD;
      const newFoodBags = Math.max(0, profile.food_bags - FOOD_BAGS_CONSUMED);
      const today = new Date().toISOString().split('T')[0];
      
      const { error: pawPointsError } = await supabase
        .from("profiles")
        .update({
          food_bags: newFoodBags,
          paw_points: newPawPoints,
          last_care_date: today
        })
        .eq("id", user.id);

      if (pawPointsError) {
        console.error("❌ Error updating paw points:", pawPointsError);
        throw new Error("Failed to update rewards");
      } else {
        console.log("✅ Profile updated - Consumed food bags:", FOOD_BAGS_CONSUMED, "Awarded paw points:", PAW_POINTS_REWARD);
      }

      // Step 6: Record paw points transaction for ledger
      try {
        const { error: transactionError } = await supabase
          .from("pet_transactions")
          .insert({
            user_id: user.id,
            pet_id: petId,
            paw_points: PAW_POINTS_REWARD,
            description: `Fed ${currentPet.pet_name} (+${PAW_POINTS_REWARD} Paw Points, -${FOOD_BAGS_CONSUMED} Food Bag)`
          });

        if (transactionError) {
          console.error("❌ CRITICAL: Paw points transaction failed:", transactionError);
        } else {
          console.log("✅ Paw points transaction recorded in ledger");
        }
      } catch (ledgerError) {
        console.error("❌ Ledger recording error:", ledgerError);
      }

      // Step 7: Award EXACTLY 10 XP
      console.log("🎯 Starting XP award process for feeding pet");
      const XP_REWARD = 10;
      
      try {
        const xpResult = await checkAndAwardXP(XP_REWARD, "pet_feed");
        console.log("🎯 XP award result:", xpResult);
        
        if (xpResult.success && xpResult.xpAwarded > 0) {
          console.log("✅ XP awarded successfully:", xpResult.xpAwarded);
        } else {
          console.log("⚠️ XP not awarded:", xpResult.reason);
        }
      } catch (xpError) {
        console.error("❌ XP processing failed:", xpError);
      }

      // Step 8: Provide user feedback with auto-clear toast
      let toastMessage = `${currentPet.pet_name} is now full and happy! 🍖`;
      let toastDescription = `+${PAW_POINTS_REWARD} Paw Points, +${XP_REWARD} XP earned. Used ${FOOD_BAGS_CONSUMED} food bag.`;

      // Special message for breeding pets - they CAN be fed
      if (currentPet.is_for_breeding) {
        toastMessage += " 💝";
        toastDescription += " (Breeding pets need extra care!)";
      }

      console.log("🎉 Pet feeding completed successfully!");
      toast({
        title: toastMessage,
        description: toastDescription,
        duration: 4000,
      });

      onSuccess?.();
      return true;

    } catch (error: any) {
      console.error("❌ Error feeding pet:", error);
      
      let errorMessage = "Failed to feed pet";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Feeding Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });

      return false;
    } finally {
      setFeeding(prev => {
        const newSet = new Set(prev);
        newSet.delete(petId);
        return newSet;
      });
    }
  };

  const isFeeding = (petId: string) => feeding.has(petId);

  return { feedPet, isFeeding };
};
