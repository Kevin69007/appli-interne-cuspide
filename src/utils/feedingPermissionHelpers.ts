
import { supabase } from "@/integrations/supabase/client";
import { checkIfUsersFriends } from "./friendshipHelpers";

export const canFeedOtherUserPets = async (
  currentUserId: string,
  targetUserId: string,
  feedingPrivacy: string
): Promise<{ canFeed: boolean; reason?: string }> => {
  // Own pets - always allowed
  if (currentUserId === targetUserId) {
    return { canFeed: true };
  }

  console.log("🔍 Checking feeding permissions:", {
    currentUserId,
    targetUserId,
    feedingPrivacy
  });

  switch (feedingPrivacy) {
    case 'user_only':
      return { 
        canFeed: false, 
        reason: "This user only allows themselves to feed their pets" 
      };
    
    case 'friends_only':
      const areFriends = await checkIfUsersFriends(currentUserId, targetUserId);
      console.log("👫 Friends check result:", areFriends);
      return { 
        canFeed: areFriends, 
        reason: areFriends ? undefined : "You need to be friends with this user to feed their pets" 
      };
    
    case 'everyone':
      return { canFeed: true };
    
    default:
      // If no privacy setting is found, default to user_only for security
      console.warn("Unknown feeding privacy setting:", feedingPrivacy, "defaulting to user_only");
      return { 
        canFeed: false, 
        reason: "This user's feeding privacy settings are not configured" 
      };
  }
};

export const canWaterOtherUserPets = async (
  currentUserId: string,
  targetUserId: string,
  feedingPrivacy: string
): Promise<{ canWater: boolean; reason?: string }> => {
  // Own pets - always allowed
  if (currentUserId === targetUserId) {
    return { canWater: true };
  }

  console.log("🔍 Checking watering permissions:", {
    currentUserId,
    targetUserId,
    feedingPrivacy
  });

  switch (feedingPrivacy) {
    case 'user_only':
      return { 
        canWater: false, 
        reason: "This user only allows themselves to water their pets" 
      };
    
    case 'friends_only':
      const areFriends = await checkIfUsersFriends(currentUserId, targetUserId);
      console.log("👫 Friends check result:", areFriends);
      return { 
        canWater: areFriends, 
        reason: areFriends ? undefined : "You need to be friends with this user to water their pets" 
      };
    
    case 'everyone':
      return { canWater: true };
    
    default:
      // If no privacy setting is found, default to user_only for security
      console.warn("Unknown watering privacy setting:", feedingPrivacy, "defaulting to user_only");
      return { 
        canWater: false, 
        reason: "This user's watering privacy settings are not configured" 
      };
  }
};

export const validateUserHasResources = (
  userProfile: any,
  actionType: 'feed' | 'water'
): { hasResources: boolean; reason?: string } => {
  if (!userProfile) {
    return { 
      hasResources: false, 
      reason: "User profile not loaded" 
    };
  }

  // Only validate food bags for feeding - NO water bag validation needed
  if (actionType === 'feed') {
    const foodBags = userProfile.food_bags || 0;
    if (foodBags <= 0) {
      return { 
        hasResources: false, 
        reason: "You need food bags to feed pets. Visit the shop to buy some!" 
      };
    }
  }

  // Watering is always free - no resource validation needed
  return { hasResources: true };
};
