
import { useState, useCallback } from "react";
import { getBreedStatConfig, generateStatInRange } from "@/utils/breedStatConfig";
import { generatePetStatsWithBreedConfig, validatePetStats } from "@/utils/statGeneration";
import { breedImages, dogBreeds, catBreeds, getBreedImage, getAvailableGenders } from "@/utils/breedImages";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const usePetGeneration = () => {
  const { user } = useAuth();
  const [availableDogs, setAvailableDogs] = useState<any[]>([]);
  const [availableCats, setAvailableCats] = useState<any[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<{[key: string]: string}>({});
  const [cachedFemaleStats, setCachedFemaleStats] = useState<{[key: string]: any}>({});
  const [userDefaultGender, setUserDefaultGender] = useState<string>('male');

  const fetchUserGenderPreference = useCallback(async () => {
    if (!user?.id) return 'male';
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("default_adopt_gender")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user gender preference:", error);
        return 'male';
      }
      
      const preference = profile?.default_adopt_gender || 'male';
      setUserDefaultGender(preference);
      return preference;
    } catch (error) {
      console.error("Error in fetchUserGenderPreference:", error);
      return 'male';
    }
  }, [user?.id]);

  const generateRandomPetForBreed = useCallback(async (breed: string) => {
    const breedConfig = getBreedStatConfig(breed);
    
    // Generate a birthday 60-85 days before today
    const today = new Date();
    const daysBack = Math.floor(Math.random() * 26) + 60;
    const birthday = new Date(today);
    birthday.setDate(today.getDate() - daysBack);

    // Use consistent stat generation with breed constraints (no over stats)
    const petStats = generatePetStatsWithBreedConfig(breedConfig);
    
    // Validate stats are within acceptable ranges - pass breed string instead of breedConfig
    if (!validatePetStats(petStats, breed) && !petStats.isLostStat) {
      console.warn(`Generated pet stats for ${breed} are outside breed ranges:`, petStats);
    }
    
    // Get user's preferred gender - torties must be female, others use user preference
    const userPreferredGender = await fetchUserGenderPreference();
    const defaultGender = breed === 'Tortie' ? 'female' : userPreferredGender;
    
    return {
      id: `pet-${crypto.randomUUID()}`,
      name: breed.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      type: dogBreeds.includes(breed) ? 'dog' : 'cat',
      breed: breed,
      gender: defaultGender,
      image_url: getBreedImage(breed),
      breedConfig: breedConfig,
      birthday: birthday.toISOString().split('T')[0],
      base_friendliness: petStats.friendliness,
      base_playfulness: petStats.playfulness,
      base_energy: petStats.energy,
      base_loyalty: petStats.loyalty,
      base_curiosity: petStats.curiosity,
      isLostStat: petStats.isLostStat
    };
  }, [fetchUserGenderPreference]);

  const generateRandomPets = useCallback(async (breeds: string[]) => {
    const pets = [];
    for (const breed of breeds) {
      pets.push(await generateRandomPetForBreed(breed));
    }
    return pets;
  }, [generateRandomPetForBreed]);

  const fetchAvailablePets = useCallback(async () => {
    try {
      // Get user's gender preference first
      const defaultGender = await fetchUserGenderPreference();
      
      const dogs = await generateRandomPets(dogBreeds);
      const cats = await generateRandomPets(catBreeds);
      
      setAvailableDogs(dogs);
      setAvailableCats(cats);
      
      // Initialize selectedGenders using user preference
      const initialGenders: {[key: string]: string} = {};
      [...dogs, ...cats].forEach(pet => {
        if (pet.breed === 'Tortie') {
          initialGenders[pet.id] = "Female";
        } else {
          // Use user's preferred gender (capitalize first letter)
          initialGenders[pet.id] = defaultGender.charAt(0).toUpperCase() + defaultGender.slice(1);
        }
      });
      setSelectedGenders(initialGenders);
      
      // Clear cached female stats when refreshing pets
      setCachedFemaleStats({});
    } catch (error) {
      console.error("Error generating pets:", error);
    }
  }, [generateRandomPets, fetchUserGenderPreference]);

  const handleGenderSelection = useCallback((petId: string, gender: string) => {
    setSelectedGenders(prev => ({
      ...prev,
      [petId]: gender
    }));
  }, []);

  const generateNewPetOfSameBreed = useCallback(async (breed: string) => {
    return await generateRandomPetForBreed(breed);
  }, [generateRandomPetForBreed]);

  const updatePetAfterAdoption = useCallback(async (oldPetId: string, breed: string) => {
    const newPetOfSameBreed = await generateNewPetOfSameBreed(breed);
    
    if (dogBreeds.includes(breed)) {
      setAvailableDogs(prev => prev.map(p => 
        p.id === oldPetId ? newPetOfSameBreed : p
      ));
    } else {
      setAvailableCats(prev => prev.map(p => 
        p.id === oldPetId ? newPetOfSameBreed : p
      ));
    }
    
    // Update selectedGenders for the new pet using user preference
    setSelectedGenders(prev => {
      const updated = { ...prev };
      delete updated[oldPetId];
      
      if (breed === 'Tortie') {
        updated[newPetOfSameBreed.id] = "Female";
      } else {
        // Use user's preferred gender (capitalize first letter)
        updated[newPetOfSameBreed.id] = userDefaultGender.charAt(0).toUpperCase() + userDefaultGender.slice(1);
      }
      return updated;
    });

    // Clear cached female stats for the old pet
    setCachedFemaleStats(prev => {
      const updated = { ...prev };
      delete updated[oldPetId];
      return updated;
    });
  }, [generateNewPetOfSameBreed, userDefaultGender]);

  const generateGenderModifiedStats = useCallback((pet: any, gender: string) => {
    if (gender === "Female") {
      // Check if we already have cached female stats for this pet
      if (cachedFemaleStats[pet.id]) {
        return cachedFemaleStats[pet.id];
      }

      // Get breed configuration to enforce min/max ranges
      const breedConfig = getBreedStatConfig(pet.breed);
      
      // Generate completely different stats for female pets using the same system as pet generation
      const femaleStatsGeneration = generatePetStatsWithBreedConfig(breedConfig);

      // Cache the female stats so they stay consistent
      setCachedFemaleStats(prev => ({
        ...prev,
        [pet.id]: femaleStatsGeneration
      }));

      return femaleStatsGeneration;
    } else {
      // For male pets, use the original base stats
      return {
        friendliness: pet.base_friendliness,
        playfulness: pet.base_playfulness,
        energy: pet.base_energy,
        loyalty: pet.base_loyalty,
        curiosity: pet.base_curiosity
      };
    }
  }, [cachedFemaleStats]);

  return {
    availableDogs,
    availableCats,
    selectedGenders,
    fetchAvailablePets,
    handleGenderSelection,
    updatePetAfterAdoption,
    generateGenderModifiedStats
  };
};
