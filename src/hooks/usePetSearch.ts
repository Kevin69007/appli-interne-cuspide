
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePetSearch = () => {
  const { toast } = useToast();
  const [searchedPet, setSearchedPet] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const searchPetByNumber = async (petNumber: number) => {
    setIsSearching(true);
    
    try {
      console.log('🔍 Searching for pet number:', petNumber);
      
      // First, try to find the pet in user_pets
      const { data: userPetData, error: userPetError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (*)
        `)
        .eq("pet_number", petNumber)
        .single();

      console.log('🔍 User pet query result:', { userPetData, userPetError });

      // If found in user_pets, get the owner's profile separately
      if (userPetData && !userPetError) {
        console.log('✅ Found pet in user_pets:', userPetData.pet_name);
        
        // Get owner profile
        const { data: ownerProfile, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userPetData.user_id)
          .single();

        console.log('👤 Owner profile query result:', { ownerProfile, profileError });

        setSearchedPet({
          ...userPetData,
          source: 'user_pets',
          profiles: ownerProfile || { username: 'Unknown' }
        });
        
        toast({
          title: "Pet Found!",
          description: `Found ${userPetData.pet_name} - Pet #${petNumber} (Owned by ${ownerProfile?.username || 'Unknown'})`,
        });
        setIsSearching(false);
        return;
      }

      // If not found in user_pets, search in shelter_pets (including unavailable ones)
      const { data: shelterPetData, error: shelterPetError } = await supabase
        .from("shelter_pets")
        .select("*")
        .eq("pet_number", petNumber)
        .single();

      console.log('🏠 Shelter pet query result:', { shelterPetData, shelterPetError });

      if (shelterPetData && !shelterPetError) {
        console.log('✅ Found pet in shelter_pets:', shelterPetData.pet_name);
        
        // Get the pet type info from the original_pet_id
        const { data: petTypeData, error: petTypeError } = await supabase
          .from("pets")
          .select("*")
          .eq("id", shelterPetData.original_pet_id)
          .single();

        console.log('🐾 Pet type query result:', { petTypeData, petTypeError });

        // Create enhanced shelter pet data with PetShelter as owner
        const enhancedShelterPet = {
          ...shelterPetData,
          pets: petTypeData || null,
          profiles: { username: 'PetShelter' },
          source: 'shelter_pets',
          // Map shelter pet fields to match user_pets structure for consistency
          user_id: '00000000-0000-0000-0000-000000000001', // PetShelter ID
          pet_id: shelterPetData.original_pet_id,
          hunger: 100, // Shelter pets are well cared for
          water: 100,
          display_order: 0
        };

        console.log('✅ Enhanced shelter pet data:', enhancedShelterPet);
        setSearchedPet(enhancedShelterPet);
        
        // Different toast messages based on availability
        if (shelterPetData.is_available) {
          toast({
            title: "Shelter Pet Found!",
            description: `Found ${shelterPetData.pet_name} - Pet #${petNumber} (Available for adoption)`,
          });
        } else {
          toast({
            title: "Pet Found!",
            description: `Found ${shelterPetData.pet_name} - Pet #${petNumber} (No longer available for adoption)`,
          });
        }
        setIsSearching(false);
        return;
      }

      // Pet not found in either table
      console.log('❌ Pet not found in user_pets or shelter_pets');
      toast({
        title: "Pet Not Found",
        description: `No pet found with ID #${petNumber}`,
        variant: "destructive",
      });
      setSearchedPet(null);
      
    } catch (error) {
      console.error("💥 Unexpected error in searchPetByNumber:", error);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setSearchedPet(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearchedPet = () => {
    setSearchedPet(null);
  };

  return {
    searchedPet,
    isSearching,
    searchPetByNumber,
    clearSearchedPet
  };
};
