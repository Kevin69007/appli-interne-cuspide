
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useShelterValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const checkBreedingStatus = async (pet: any) => {
    console.log("🔍 Checking breeding status for pet:", pet.pet_name, "ID:", pet.id);
    
    try {
      const { data: breedingPairs, error } = await supabase
        .from("breeding_pairs")
        .select("id, is_completed, is_born, is_weaned")
        .or(`parent1_id.eq.${pet.id},parent2_id.eq.${pet.id}`)
        .eq("is_completed", false);

      if (error) {
        console.error("❌ Error checking breeding status:", error);
        return false;
      }

      console.log("🔍 Breeding pairs found for", pet.pet_name, ":", breedingPairs);
      
      const isCurrentlyBreeding = breedingPairs && breedingPairs.length > 0;
      console.log("🎯 Pet", pet.pet_name, "is currently breeding:", isCurrentlyBreeding);
      
      return isCurrentlyBreeding;
    } catch (error) {
      console.error("❌ Exception checking breeding status:", error);
      return false;
    }
  };

  const validateSaleEligibility = async (pet: any) => {
    if (!user) {
      console.error("❌ No user found for shelter sale");
      toast({
        title: "Authentication required",
        description: "Please log in to sell pets to the shelter.",
        variant: "destructive",
      });
      return false;
    }

    console.log("🏠 ==> STARTING SHELTER SALE VALIDATION <==");
    console.log("🏠 User ID:", user.id);
    console.log("🏠 Pet to sell:", {
      id: pet.id,
      name: pet.pet_name,
      breed: pet.breed,
      user_id: pet.user_id,
      pet_id: pet.pet_id,
      pet_number: pet.pet_number,
      is_locked: pet.is_locked
    });

    // Enhanced ownership validation
    if (pet.user_id !== user.id) {
      console.error("❌ Pet ownership mismatch:", {
        petUserId: pet.user_id,
        currentUserId: user.id
      });
      toast({
        title: "Error",
        description: "You don't own this pet.",
        variant: "destructive",
      });
      return false;
    }

    // Check if pet is locked
    if (pet.is_locked) {
      console.error("❌ Pet is locked - cannot sell to shelter");
      toast({
        title: "Cannot sell locked pet",
        description: "Please unlock this pet before selling to the shelter.",
        variant: "destructive",
      });
      return false;
    }

    // Check breeding status
    const finalBreedingCheck = await checkBreedingStatus(pet);
    
    if (finalBreedingCheck) {
      console.log("❌ Pet is actively breeding, blocking sale");
      toast({
        title: "Cannot sell breeding pet",
        description: "This pet is currently involved in breeding and cannot be sold until the breeding process is complete.",
        variant: "destructive",
      });
      return false;
    }

    console.log("✅ Pet is NOT actively breeding, proceeding with sale");

    // Additional validation - check if pet already exists in shelter
    try {
      const { data: existingShelterPet, error: shelterError } = await supabase
        .from("shelter_pets")
        .select("id")
        .eq("user_pet_id", pet.id)
        .eq("is_available", true)
        .maybeSingle();

      if (shelterError) {
        console.error("❌ Error checking shelter pets:", shelterError);
        // Don't block sale for this error, just log it
      }

      if (existingShelterPet) {
        console.error("❌ Pet already in shelter");
        toast({
          title: "Pet already in shelter",
          description: "This pet is already listed in the shelter.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("❌ Exception checking shelter pets:", error);
      // Don't block sale for this error
    }

    return true;
  };

  return {
    checkBreedingStatus,
    validateSaleEligibility
  };
};
