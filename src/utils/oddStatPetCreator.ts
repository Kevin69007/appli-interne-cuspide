
import { supabase } from "@/integrations/supabase/client";
import { generateNaturalStat } from "@/utils/statGeneration";
import { getBreedStatConfig } from "@/utils/breedStatConfig";

export const createOddStatPet = async (userId: string) => {
  try {
    // Get German Shepherd breed configuration
    const breedConfig = getBreedStatConfig('german shepherd');
    
    // Generate stats within German Shepherd ranges, but make playfulness lost (-5)
    const friendliness = generateNaturalStat(breedConfig.friendliness.min, breedConfig.friendliness.max);
    const playfulness = -5; // Lost stat
    const energy = generateNaturalStat(breedConfig.energy.min, breedConfig.energy.max);
    const loyalty = generateNaturalStat(breedConfig.loyalty.min, breedConfig.loyalty.max);
    const curiosity = generateNaturalStat(breedConfig.curiosity.min, breedConfig.curiosity.max);

    // Generate birthday (60-85 days ago like normal pets)
    const today = new Date();
    const daysBack = Math.floor(Math.random() * 26) + 60;
    const birthday = new Date(today);
    birthday.setDate(today.getDate() - daysBack);

    // Get the German Shepherd pet ID from pets table (assuming it exists)
    const { data: germanShepherdPet, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('name', 'German Shepherd')
      .single();

    if (petError || !germanShepherdPet) {
      throw new Error('German Shepherd pet type not found in pets table');
    }

    // Insert the female German Shepherd with lost playfulness
    const { data, error } = await supabase
      .from('user_pets')
      .insert({
        user_id: userId,
        pet_id: germanShepherdPet.id,
        pet_name: 'Luna',
        breed: 'German Shepherd',
        gender: 'female',
        friendliness: friendliness,
        playfulness: playfulness,
        energy: energy,
        loyalty: loyalty,
        curiosity: curiosity,
        birthday: birthday.toISOString().split('T')[0],
        description: 'A beautiful female German Shepherd with a playful spirit that seems to have dimmed.',
        hunger: 100,
        water: 100,
        is_first_pet: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating German Shepherd pet:', error);
      throw error;
    }

    console.log('Successfully created female German Shepherd with lost playfulness:', data);
    return data;
  } catch (error) {
    console.error('Failed to create German Shepherd pet:', error);
    throw error;
  }
};
