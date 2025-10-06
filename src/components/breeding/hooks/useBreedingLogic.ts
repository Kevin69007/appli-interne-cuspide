
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getValidParentBreed } from "../utils/breedValidation";
import { canPetBreed } from "@/utils/breedingUtils";

interface UserPet {
  id: string;
  pet_name: string;
  breed: string;
  gender: string;
  pets?: {
    name: string;
    type: string;
  };
  user_id: string;
  breeding_cooldown_until?: string;
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
}

export const useBreedingLogic = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availablePets, setAvailablePets] = useState<UserPet[]>([]);
  const [selectedParent1, setSelectedParent1] = useState<UserPet | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<UserPet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBreeding, setIsBreeding] = useState(false);
  const [userLicenseCount, setUserLicenseCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch user's pets
      const { data: pets, error: petsError } = await supabase
        .from("user_pets")
        .select(`
          id,
          pet_name,
          breed,
          gender,
          user_id,
          breeding_cooldown_until,
          friendliness,
          playfulness,
          energy,
          loyalty,
          curiosity,
          pets!inner(name, type)
        `)
        .eq("user_id", user.id);

      if (petsError) throw petsError;

      setAvailablePets(pets || []);

      // Fetch litter licenses count
      const { data: licenses, error: licensesError } = await supabase
        .from("litter_licenses")
        .select("*")
        .eq("user_id", user.id)
        .eq("used", false);

      if (licensesError) throw licensesError;

      setUserLicenseCount(licenses?.length || 0);

    } catch (error) {
      console.error("Error fetching breeding data:", error);
      toast({
        title: "Error",
        description: "Failed to load breeding data",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const getCompatiblePets = (selectedPet: UserPet | null): UserPet[] => {
    if (!selectedPet) {
      // Filter out pets that cannot breed at all (like male Torties)
      return availablePets.filter(pet => canPetBreed(pet.breed, pet.gender));
    }

    return availablePets.filter(pet => {
      if (pet.id === selectedPet.id) return false;
      if (pet.gender === selectedPet.gender) return false;

      // Check if either pet cannot breed
      if (!canPetBreed(selectedPet.breed, selectedPet.gender) || !canPetBreed(pet.breed, pet.gender)) {
        return false;
      }

      if (pet.breeding_cooldown_until) {
        const cooldownEnd = new Date(pet.breeding_cooldown_until);
        if (cooldownEnd > new Date()) {
          return false;
        }
      }

      const firstPetBreed = getValidParentBreed(selectedPet);
      const secondPetBreed = getValidParentBreed(pet);
      const firstPetType = selectedPet.pets?.type;
      const secondPetType = pet.pets?.type;

      if (!firstPetBreed || !secondPetBreed) return false;
      if (firstPetType !== secondPetType) return false;

      return true;
    });
  };

  const startBreeding = async (parent1Id: string, parent2Id: string) => {
    if (!user) return;
    
    if (userLicenseCount < 2) {
      toast({
        title: "Insufficient Litter Licenses",
        description: "You need 2 litter licenses to start breeding (one for each pet)",
        variant: "destructive",
      });
      return;
    }
    
    setIsBreeding(true);
    try {
      // Use 2 litter licenses
      const { data: licenses, error: licenseError } = await supabase
        .from("litter_licenses")
        .select("id")
        .eq("user_id", user.id)
        .eq("used", false)
        .limit(2);

      if (licenseError) throw licenseError;

      if (!licenses || licenses.length < 2) {
        throw new Error("Insufficient litter licenses available");
      }

      // Mark licenses as used
      await supabase
        .from("litter_licenses")
        .update({ used: true, pet_id: parent1Id })
        .eq("id", licenses[0].id);

      await supabase
        .from("litter_licenses")
        .update({ used: true, pet_id: parent2Id })
        .eq("id", licenses[1].id);

      // Create breeding pair
      await supabase
        .from("breeding_pairs")
        .insert({
          user_id: user.id,
          parent1_id: parent1Id,
          parent2_id: parent2Id,
          litter_size: Math.floor(Math.random() * 6) + 1, // 1-6 babies
        });

      // Set breeding cooldown
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + 14);

      await supabase
        .from("user_pets")
        .update({
          breeding_cooldown_until: cooldownDate.toISOString(),
          last_bred: new Date().toISOString()
        })
        .in("id", [parent1Id, parent2Id]);

      toast({
        title: "Breeding Started! 💕",
        description: "Your pets have started breeding. Check back in 14 days! 2 litter licenses were used.",
      });

      setSelectedParent1(null);
      setSelectedParent2(null);
      fetchData();

    } catch (error: any) {
      console.error("Error starting breeding:", error);
      toast({
        title: "Breeding Failed",
        description: error.message || "Failed to start breeding",
        variant: "destructive",
      });
    } finally {
      setIsBreeding(false);
    }
  };

  return {
    availablePets,
    selectedParent1,
    selectedParent2,
    isLoading,
    isBreeding,
    userLicenseCount,
    setSelectedParent1,
    setSelectedParent2,
    getCompatiblePets,
    startBreeding,
    fetchData
  };
};
