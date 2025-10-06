
import { supabase } from "@/integrations/supabase/client";

interface CustomPetStats {
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
}

export const createCustomPet = async (
  userId: string,
  petName: string,
  breed: string,
  gender: string,
  stats: CustomPetStats
) => {
  try {
    // Generate a birthday 60-85 days before today
    const today = new Date();
    const daysBack = Math.floor(Math.random() * 26) + 60;
    const birthday = new Date(today);
    birthday.setDate(today.getDate() - daysBack);

    console.log(`Creating ${breed} with custom stats:`, stats);

    // First create the pet record in pets table
    const petInsertData = {
      name: breed,
      type: 'cat' as const,
      base_friendliness: stats.friendliness,
      base_playfulness: stats.playfulness,
      base_energy: stats.energy,
      base_loyalty: stats.loyalty,
      base_curiosity: stats.curiosity,
      image_url: "/lovable-uploads/ca24ff23-a1c6-4913-90e0-83f85212dcb2.png" // Persian cat image
    };

    const { data: newPet, error: petError } = await supabase
      .from("pets")
      .insert(petInsertData)
      .select()
      .single();

    if (petError) {
      console.error("Error creating pet record:", petError);
      throw new Error(`Failed to create pet record: ${petError.message}`);
    }

    console.log("Pet record created:", newPet);

    // Create user_pet record
    const userPetData = {
      user_id: userId,
      pet_id: newPet.id,
      pet_name: petName,
      breed: breed,
      gender: gender,
      friendliness: stats.friendliness,
      playfulness: stats.playfulness,
      energy: stats.energy,
      loyalty: stats.loyalty,
      curiosity: stats.curiosity,
      hunger: 100,
      water: 100,
      is_first_pet: false,
      adopted_at: new Date().toISOString(),
      birthday: birthday.toISOString().split('T')[0],
    };

    console.log("Creating user_pet record:", userPetData);

    const { error: insertError } = await supabase
      .from("user_pets")
      .insert(userPetData);

    if (insertError) {
      console.error("Error creating user_pet record:", insertError);
      // Clean up the pet record if user_pet creation failed
      await supabase.from("pets").delete().eq("id", newPet.id);
      throw new Error(`Failed to create user pet record: ${insertError.message}`);
    }

    console.log(`${breed} created successfully`);
    return newPet;

  } catch (error) {
    console.error("Error creating custom pet:", error);
    throw error;
  }
};
