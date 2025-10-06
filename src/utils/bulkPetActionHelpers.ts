
import { supabase } from "@/integrations/supabase/client";

export const canPerformBulkActions = async (
  userId: string,
  targetUserId: string,
  feedingPrivacy: string
): Promise<boolean> => {
  // If it's the user's own pets, always allow
  if (userId === targetUserId) {
    return true;
  }

  // Check feeding privacy settings
  if (feedingPrivacy === 'user_only') {
    return false;
  }

  if (feedingPrivacy === 'friends_only') {
    // Check if users are friends
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${userId})`)
      .single();

    return !!friendship;
  }

  // 'everyone' or any other value allows feeding
  return true;
};

export const getUserPetsForBulkAction = async (userId: string, actionType: 'feed' | 'water') => {
  const { data: pets, error } = await supabase
    .from("user_pets")
    .select("id, pet_name, hunger, water, last_fed, last_watered, user_id")
    .eq("user_id", userId);

  if (error) {
    console.error(`Error fetching pets for ${actionType}:`, error);
    return [];
  }

  return pets || [];
};
