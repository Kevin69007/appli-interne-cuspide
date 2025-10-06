
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateCurrentStats } from "@/utils/petHelpers";

export const usePetProfileByNumber = (petNumber: string | undefined) => {
  const { toast } = useToast();
  const [pet, setPet] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShelterPet, setIsShelterPet] = useState(false);

  const fetchPetByNumber = async () => {
    if (!petNumber) {
      setError("Pet number is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 usePetProfileByNumber - Searching for pet number:', petNumber);

      // First try to find in user_pets (owned pets) - use limit(1) instead of single()
      const { data: userPetData, error: userPetError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (*)
        `)
        .eq("pet_number", parseInt(petNumber))
        .limit(1);

      console.log('🔍 usePetProfileByNumber - user_pets query result:', { userPetData, userPetError });

      if (userPetData && userPetData.length > 0 && !userPetError) {
        // Found in user_pets - use the first result
        const userPet = userPetData[0];
        console.log('🔍 usePetProfileByNumber - Found pet in user_pets:', userPet);
        
        const processedPet = calculateCurrentStats(userPet);

        // Check if pet is currently for breeding
        const { data: breedingData } = await supabase
          .from("breeding_pairs")
          .select("id")
          .or(`parent1_id.eq.${userPet.id},parent2_id.eq.${userPet.id}`)
          .eq("is_completed", false)
          .limit(1);

        processedPet.is_for_breeding = breedingData && breedingData.length > 0;
        setPet(processedPet);
        setIsShelterPet(false);

        // Fetch owner profile
        const { data: ownerData, error: ownerError } = await supabase
          .from("profiles")
          .select(`
            id, 
            username, 
            profile_image_url,
            profile_description,
            xp,
            tier,
            care_badge_days,
            pawclub_member,
            created_at
          `)
          .eq("id", userPet.user_id)
          .single();

        console.log('🔍 usePetProfileByNumber - Owner data:', { ownerData, ownerError });

        if (!ownerError) {
          setOwner(ownerData);
        }
      } else {
        // Not found in user_pets, try shelter_pets - use limit(1) instead of single()
        console.log('🔍 usePetProfileByNumber - Not found in user_pets, trying shelter_pets');
        
        const { data: shelterPetData, error: shelterPetError } = await supabase
          .from("shelter_pets")
          .select("*")
          .eq("pet_number", parseInt(petNumber))
          .limit(1);

        console.log('🔍 usePetProfileByNumber - shelter_pets query result:', { shelterPetData, shelterPetError });

        if (shelterPetData && shelterPetData.length > 0 && !shelterPetError) {
          // Found in shelter_pets - use the first result
          const shelterPet = shelterPetData[0];
          const { data: petTypeData } = await supabase
            .from("pets")
            .select("*")
            .eq("id", shelterPet.original_pet_id)
            .single();

          // Map shelter pet to match user_pets structure
          const mappedShelterPet = {
            id: shelterPet.id,
            user_id: '00000000-0000-0000-0000-000000000001', // PetShelter ID
            pet_id: shelterPet.original_pet_id,
            pet_name: shelterPet.pet_name,
            breed: shelterPet.breed,
            gender: shelterPet.gender,
            friendliness: shelterPet.friendliness,
            playfulness: shelterPet.playfulness,
            energy: shelterPet.energy,
            loyalty: shelterPet.loyalty,
            curiosity: shelterPet.curiosity,
            hunger: 100, // Shelter pets are well cared for
            water: 100,
            birthday: shelterPet.birthday,
            adopted_at: shelterPet.listed_at,
            pet_number: shelterPet.pet_number,
            pets: petTypeData,
            // Shelter-specific data with correct price
            price_nd: 70, // Fixed adoption price to 70 PD
            is_available: shelterPet.is_available,
            description: shelterPet.description,
            seller_id: shelterPet.seller_id
          };

          setPet(mappedShelterPet);
          setIsShelterPet(true);

          // Set shelter as owner
          setOwner({
            id: '00000000-0000-0000-0000-000000000001',
            username: 'PetShelter',
            profile_image_url: null,
            profile_description: 'The official pet shelter',
            xp: 0,
            tier: 'admin',
            care_badge_days: 0,
            pawclub_member: false,
            created_at: new Date().toISOString()
          });
        } else {
          const errorMessage = `Pet #${petNumber} not found`;
          console.error('🔍 usePetProfileByNumber - Pet not found:', errorMessage);
          throw new Error(errorMessage);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load pet details";
      console.error("🔍 usePetProfileByNumber - Error:", error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetByNumber();
  }, [petNumber]);

  return {
    pet,
    owner,
    loading,
    error,
    isShelterPet,
    refetch: fetchPetByNumber
  };
};
