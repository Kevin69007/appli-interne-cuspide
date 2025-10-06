
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyXP } from "@/hooks/useDailyXP";
import { calculateCurrentStats } from "@/utils/petHelpers";

export const usePetActions = (onUpdate: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkAndAwardXP } = useDailyXP();

  const feedPet = async (pet: any, profile: any) => {
    if (!user || !profile) return;

    console.log("Feeding pet with profile:", profile);
    console.log("Current food_bags:", profile.food_bags);
    console.log("Current paw_points:", profile.paw_points);

    if ((profile.food_bags || 0) <= 0) {
      toast({
        title: "No food bags",
        description: "You need food bags to feed your pet. Visit the shop to buy some!",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate current hunger level based on time decay
      const petWithCurrentStats = calculateCurrentStats(pet);
      const currentHunger = petWithCurrentStats.hunger;

      // Check if pet is already full using calculated current hunger
      if (currentHunger >= 100) {
        toast({
          title: "Pet is already full",
          description: `${pet.pet_name} is already full and doesn't need food right now!`,
          variant: "destructive",
        });
        return;
      }

      // Get the most current profile data to ensure accurate paw points calculation
      const { data: currentProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("food_bags, paw_points")
        .eq("id", user.id)
        .single();

      if (profileFetchError) {
        console.error("Profile fetch error:", profileFetchError);
        throw profileFetchError;
      }

      console.log("Current profile before feeding single pet:", {
        food_bags: currentProfile?.food_bags,
        paw_points: currentProfile?.paw_points
      });

      // Update pet hunger and last_fed timestamp
      const { error: petError } = await supabase
        .from("user_pets")
        .update({
          last_fed: new Date().toISOString(),
          hunger: 100
        })
        .eq("id", pet.id)
        .eq("user_id", user.id);

      if (petError) {
        console.error("Pet update error:", petError);
        throw petError;
      }

      // Calculate new values - ensure we're adding to existing amounts
      const currentFoodBags = currentProfile?.food_bags || 0;
      const currentPawPoints = currentProfile?.paw_points || 0;
      const newFoodBags = currentFoodBags - 1;
      const newPawPoints = currentPawPoints + 10;

      console.log("Calculating updates for single pet feeding:", {
        currentFoodBags,
        newFoodBags,
        currentPawPoints,
        adding: 10,
        newPawPoints
      });

      // Update profile with reduced food bags and increased paw points
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          food_bags: newFoodBags,
          paw_points: newPawPoints
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      // Verify the update was successful
      const { data: updatedProfile, error: verifyError } = await supabase
        .from("profiles")
        .select("food_bags, paw_points")
        .eq("id", user.id)
        .single();

      if (verifyError) {
        console.error("Verification error:", verifyError);
      } else {
        console.log("Updated profile after feeding single pet:", {
          food_bags: updatedProfile?.food_bags,
          paw_points: updatedProfile?.paw_points
        });
      }

      // Award 10 XP for feeding with daily limit check
      const xpAwarded = await checkAndAwardXP(10, "feeding your pet");
      
      if (xpAwarded) {
        const { error: activityError } = await supabase
          .from("pet_activities")
          .insert({
            user_pet_id: pet.id,
            activity_type: "fed",
            xp_gained: 10
          });

        if (activityError) {
          console.error("Activity error:", activityError);
          // Don't throw here, it's not critical
        }
      }

      // Record paw points transaction
      const { error: transactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: pet.id,
          paw_points: 10,
          description: "Fed pet"
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        // Don't throw here, it's not critical
      }

      toast({
        title: "Pet fed successfully!",
        description: `${pet.pet_name} has been fed and you earned 10 paw points!`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error feeding pet:", error);
      toast({
        title: "Error",
        description: "Failed to feed pet",
        variant: "destructive",
      });
    }
  };

  const waterPet = async (pet: any) => {
    if (!user) return;

    try {
      // Calculate current water level based on time decay
      const petWithCurrentStats = calculateCurrentStats(pet);
      const currentWater = petWithCurrentStats.water;

      // Check if pet is already fully hydrated using calculated current water
      if (currentWater >= 100) {
        toast({
          title: "Pet is already hydrated",
          description: `${pet.pet_name} is already fully hydrated and doesn't need water right now!`,
          variant: "destructive",
        });
        return;
      }

      // Get current profile to read existing paw_points
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("paw_points")
        .eq("id", user.id)
        .single();

      if (profileFetchError) {
        console.error("Profile fetch error:", profileFetchError);
        throw profileFetchError;
      }

      console.log("Current paw_points before watering:", profile?.paw_points);

      const { error: petError } = await supabase
        .from("user_pets")
        .update({
          last_watered: new Date().toISOString(),
          water: 100
        })
        .eq("id", pet.id)
        .eq("user_id", user.id);

      if (petError) throw petError;

      // Add 10 paw points to existing amount
      const currentPawPoints = profile?.paw_points || 0;
      const newPawPoints = currentPawPoints + 10;

      console.log("Adding paw points for watering:", {
        currentPawPoints,
        adding: 10,
        newPawPoints
      });

      // Update profile with increased paw points
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          paw_points: newPawPoints
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError);
        throw profileUpdateError;
      }

      // Award 10 XP for watering with daily limit check
      const xpAwarded = await checkAndAwardXP(10, "watering your pet");
      
      if (xpAwarded) {
        const { error: activityError } = await supabase
          .from("pet_activities")
          .insert({
            user_pet_id: pet.id,
            activity_type: "watered",
            xp_gained: 10
          });

        if (activityError) throw activityError;
      }

      // Record paw points transaction
      const { error: transactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: pet.id,
          paw_points: 10,
          description: "Watered pet"
        });

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        // Don't throw here, it's not critical
      }

      onUpdate();
    } catch (error) {
      console.error("Error watering pet:", error);
      toast({
        title: "Error",
        description: "Failed to water pet",
        variant: "destructive",
      });
    }
  };

  const purchasePet = async (pet: any, petSaleInfo: any) => {
    if (!user || !petSaleInfo) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.paw_dollars < petSaleInfo.price_nd) {
        toast({
          title: "Insufficient funds",
          description: "You don't have enough Paw Dollars to purchase this pet",
          variant: "destructive",
        });
        return;
      }

      const { error: transferError } = await supabase
        .from("user_pets")
        .update({ user_id: user.id })
        .eq("id", pet.id);

      if (transferError) throw transferError;

      const { error: buyerError } = await supabase
        .from("profiles")
        .update({ paw_dollars: profile.paw_dollars - petSaleInfo.price_nd })
        .eq("id", user.id);

      if (buyerError) throw buyerError;

      const { data: sellerProfile, error: sellerFetchError } = await supabase
        .from("profiles")
        .select("paw_dollars")
        .eq("id", petSaleInfo.seller_id)
        .single();

      if (sellerFetchError) throw sellerFetchError;

      const { error: sellerError } = await supabase
        .from("profiles")
        .update({ paw_dollars: sellerProfile.paw_dollars + petSaleInfo.price_nd })
        .eq("id", petSaleInfo.seller_id);

      if (sellerError) throw sellerError;

      const { error: saleError } = await supabase
        .from("pet_sales")
        .update({ is_active: false })
        .eq("id", petSaleInfo.id);

      if (saleError) throw saleError;

      // Record transaction for buyer
      const { error: buyerTransactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: pet.id,
          paw_dollars: -petSaleInfo.price_nd,
          description: `Purchased ${pet.pet_name} from another user`
        });

      if (buyerTransactionError) throw buyerTransactionError;

      // Record transaction for seller
      const { error: sellerTransactionError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: petSaleInfo.seller_id,
          pet_id: pet.id,
          paw_dollars: petSaleInfo.price_nd,
          description: `Sold ${pet.pet_name} to another user`
        });

      if (sellerTransactionError) throw sellerTransactionError;

      toast({
        title: "Purchase successful!",
        description: `You have successfully purchased ${pet.pet_name}`,
      });

      onUpdate();
    } catch (error) {
      console.error("Error purchasing pet:", error);
      toast({
        title: "Error",
        description: "Failed to purchase pet",
        variant: "destructive",
      });
    }
  };

  return {
    feedPet,
    waterPet,
    purchasePet
  };
};
