
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDailyXP } from "@/hooks/useDailyXP";
import { calculateCurrentStats } from "@/utils/petHelpers";

export const useWaterPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkAndAwardXP } = useDailyXP();
  const [isWatering, setIsWatering] = useState(false);

  const waterPet = async (petId: string, onSuccess?: () => void) => {
    if (!user || isWatering) return;

    setIsWatering(true);
    console.log("💧 Starting to water pet:", petId, "for user:", user.id);

    try {
      // Step 1: Get current pet and verify ownership
      const { data: pet, error: petError } = await supabase
        .from("user_pets")
        .select("water, last_watered, user_id, pet_name, pet_id, is_for_breeding")
        .eq("id", petId)
        .single();

      if (petError) throw petError;

      // Check if pet belongs to user
      if (pet.user_id !== user.id) {
        throw new Error("You can only water your own pets");
      }

      // Step 2: Calculate current water level based on time decay
      const petWithCurrentStats = calculateCurrentStats(pet);
      const currentWater = Math.max(0, petWithCurrentStats.water);

      console.log("💧 Pet water status:", {
        petName: pet.pet_name,
        storedWater: pet.water,
        currentWater: currentWater,
        lastWatered: pet.last_watered,
        isForBreeding: pet.is_for_breeding
      });

      // Check if pet needs watering using 100% threshold - can water anytime under 100%
      if (currentWater >= 100) {
        throw new Error(`${pet.pet_name} doesn't need water right now! They have ${currentWater}% water and are completely hydrated.`);
      }

      // Step 3: Update pet water to 100% and last watered time
      const { error: updatePetError } = await supabase
        .from("user_pets")
        .update({
          water: 100,
          last_watered: new Date().toISOString()
        })
        .eq("id", petId);

      if (updatePetError) throw updatePetError;

      console.log("✅ Pet water updated successfully to 100%");

      // Step 4: Get current profile for paw points
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_points")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Step 5: Award EXACTLY 10 paw points
      const PAW_POINTS_REWARD = 10;
      const today = new Date().toISOString().split('T')[0];
      const newPawPoints = Math.max(0, (profile.paw_points || 0)) + PAW_POINTS_REWARD;

      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          paw_points: newPawPoints,
          last_care_date: today
        })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error("❌ Error updating paw points:", updateProfileError);
        throw new Error("Failed to update rewards");
      } else {
        console.log("✅ Paw points awarded successfully:", PAW_POINTS_REWARD);
      }

      // Step 6: Record paw points transaction for ledger
      try {
        const { error: transactionError } = await supabase
          .from("pet_transactions")
          .insert({
            user_id: user.id,
            pet_id: petId,
            paw_points: PAW_POINTS_REWARD,
            description: `Watered ${pet.pet_name} (+${PAW_POINTS_REWARD} Paw Points)`
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
      console.log("🎯 Starting XP award process for watering pet");
      const XP_REWARD = 10;
      
      try {
        const xpResult = await checkAndAwardXP(XP_REWARD, "pet_water");
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
      let toastMessage = `${pet.pet_name}'s thirst was quenched! 💧`;
      let toastDescription = `+${PAW_POINTS_REWARD} Paw Points, +${XP_REWARD} XP earned`;

      // Special message for breeding pets - they CAN be watered
      if (pet.is_for_breeding) {
        toastMessage += " 💝";
        toastDescription += " (Breeding pets need extra care!)";
      }

      console.log("🎉 Pet watering completed successfully!");
      toast({
        title: toastMessage,
        description: toastDescription,
        duration: 4000,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("❌ Error watering pet:", error);
      toast({
        title: "Watering Failed",
        description: error.message || "Failed to water pet",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsWatering(false);
    }
  };

  return { waterPet, isWatering };
};
