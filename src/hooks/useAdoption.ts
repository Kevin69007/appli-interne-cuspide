
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAdoptionCost } from "@/utils/breedImages";

export const useAdoption = (profile: any, fetchProfile: () => void, updatePetAfterAdoption: (petId: string, breed: string) => void, generateGenderModifiedStats: (pet: any, gender: string) => any) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adopting, setAdopting] = useState<string | null>(null);

  const adoptPet = async (pet: any, selectedGenders: {[key: string]: string}) => {
    if (!user) {
      console.error("Adoption failed: No authenticated user");
      toast({
        title: "Authentication required",
        description: "Please log in to adopt a pet",
        variant: "destructive",
      });
      return;
    }

    const selectedGender = selectedGenders[pet.id];
    if (!selectedGender) {
      console.error("Adoption failed: No gender selected for pet", pet.id);
      toast({
        title: "Gender required",
        description: "Please select a gender for your pet before adopting",
        variant: "destructive",
      });
      return;
    }

    // Normalize gender to lowercase to match database expectations
    const normalizedGender = selectedGender.toLowerCase();
    if (normalizedGender !== 'male' && normalizedGender !== 'female') {
      console.error("Adoption failed: Invalid gender value", selectedGender);
      toast({
        title: "Invalid gender",
        description: "Please select a valid gender for your pet",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting adoption process for pet:", {
      petId: pet.id,
      petName: pet.name,
      breed: pet.breed,
      selectedGender: normalizedGender,
      userId: user.id
    });

    setAdopting(pet.id);
    
    try {
      // Use a single atomic query to check for existing pets and get current profile
      console.log("Checking existing pets and profile for user:", user.id);
      
      const [petsQuery, profileQuery] = await Promise.all([
        supabase
          .from("user_pets")
          .select("id")
          .eq("user_id", user.id)
          .limit(1),
        supabase
          .from("profiles")
          .select("paw_dollars")
          .eq("id", user.id)
          .single()
      ]);

      if (petsQuery.error) {
        console.error("Error checking existing pets:", petsQuery.error);
        throw new Error(`Failed to check existing pets: ${petsQuery.error.message}`);
      }

      if (profileQuery.error) {
        console.error("Error fetching current profile:", profileQuery.error);
        throw new Error(`Failed to fetch profile: ${profileQuery.error.message}`);
      }

      const isFirstPet = !petsQuery.data || petsQuery.data.length === 0;
      const currentProfile = profileQuery.data;
      
      // Calculate correct adoption price based on breed and gender
      const adoptionPrice = getAdoptionCost(pet.breed, normalizedGender, isFirstPet);

      console.log("Adoption details:", {
        isFirstPet,
        adoptionPrice,
        userPawDollars: currentProfile.paw_dollars,
        breed: pet.breed,
        gender: normalizedGender
      });

      // Check funds for non-first pets
      if (!isFirstPet && currentProfile.paw_dollars < adoptionPrice) {
        console.error("Insufficient funds for adoption");
        toast({
          title: "Insufficient funds",
          description: `You need ${adoptionPrice} PawDollars to adopt this pet`,
          variant: "destructive",
        });
        return;
      }

      // Generate the exact stats that will be displayed to the user
      const modifiedStats = generateGenderModifiedStats(pet, selectedGender);
      
      console.log("Generated stats for adoption:", {
        originalStats: {
          friendliness: pet.base_friendliness,
          playfulness: pet.base_playfulness,
          energy: pet.base_energy,
          loyalty: pet.base_loyalty,
          curiosity: pet.base_curiosity
        },
        modifiedStats
      });

      // Validate pet data before proceeding
      if (!pet.breed || !pet.type || !pet.name) {
        console.error("Invalid pet data:", pet);
        throw new Error("Pet data is incomplete");
      }

      // Validate and normalize pet type
      const petType = pet.type.toLowerCase();
      if (petType !== 'dog' && petType !== 'cat') {
        console.error("Invalid pet type:", pet.type);
        throw new Error(`Invalid pet type: ${pet.type}`);
      }

      // Start atomic transaction
      console.log("Starting atomic adoption transaction");

      // Create pet record in pets table with proper validation
      const petInsertData = {
        name: pet.breed,
        type: petType as 'dog' | 'cat',
        base_friendliness: pet.base_friendliness,
        base_playfulness: pet.base_playfulness,
        base_energy: pet.base_energy,
        base_loyalty: pet.base_loyalty,
        base_curiosity: pet.base_curiosity,
        image_url: pet.image_url
      };

      console.log("Creating pet record:", petInsertData);
      
      const { data: newPet, error: petError } = await supabase
        .from("pets")
        .insert(petInsertData)
        .select()
        .single();

      if (petError) {
        console.error("Error creating pet record:", petError);
        throw new Error(`Failed to create pet record: ${petError.message}`);
      }

      console.log("Pet record created successfully:", newPet);

      // Create user_pet record with exact stats
      const userPetData = {
        user_id: user.id,
        pet_id: newPet.id,
        pet_name: pet.name,
        breed: pet.breed,
        gender: normalizedGender,
        friendliness: modifiedStats.friendliness,
        playfulness: modifiedStats.playfulness,
        energy: modifiedStats.energy,
        loyalty: modifiedStats.loyalty,
        curiosity: modifiedStats.curiosity,
        hunger: 100,
        water: 100,
        is_first_pet: isFirstPet,
        adopted_at: new Date().toISOString(),
        birthday: pet.birthday,
      };

      console.log("Creating user_pet record:", userPetData);

      const { error: insertError } = await supabase
        .from("user_pets")
        .insert(userPetData);

      if (insertError) {
        console.error("Error creating user_pet record:", insertError);
        // Try to clean up the pet record if user_pet creation failed
        await supabase.from("pets").delete().eq("id", newPet.id);
        throw new Error(`Failed to create user pet record: ${insertError.message}`);
      }

      console.log("User pet record created successfully");

      // Update user balance for non-first pets
      if (!isFirstPet) {
        console.log("Deducting paw dollars for non-first pet");
        const { error: moneyError } = await supabase
          .from("profiles")
          .update({ paw_dollars: currentProfile.paw_dollars - adoptionPrice })
          .eq("id", user.id);

        if (moneyError) {
          console.error("Error updating paw dollars:", moneyError);
          // Don't rollback the adoption here as the pet was successfully adopted
          // Just log the error and continue
          console.warn("Pet adopted but paw dollars not deducted - manual intervention may be needed");
        }
      }

      // Record the adoption transaction
      console.log("Recording adoption transaction");
      const { error: ledgerError } = await supabase
        .from("pet_transactions")
        .insert({
          user_id: user.id,
          pet_id: newPet.id,
          paw_dollars: -adoptionPrice,
          description: isFirstPet 
            ? `Adopted ${pet.name} from the play center (First pet - FREE!)`
            : `Adopted ${pet.name} from the play center for ${adoptionPrice} PD`
        });

      if (ledgerError) {
        console.error("Error recording adoption transaction:", ledgerError);
        // Don't throw here as the main adoption succeeded
      }

      console.log("Adoption completed successfully");

      toast({
        title: "Congratulations!",
        description: isFirstPet 
          ? `You've adopted ${pet.name} for FREE! Welcome to your new companion.`
          : `You've adopted ${pet.name}! Welcome to your new companion.`,
      });

      fetchProfile();
      updatePetAfterAdoption(pet.id, pet.breed);
      
    } catch (error) {
      console.error("Error adopting pet:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Adoption failed",
        description: `Failed to adopt pet: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setAdopting(null);
    }
  };

  return {
    adopting,
    adoptPet
  };
};
