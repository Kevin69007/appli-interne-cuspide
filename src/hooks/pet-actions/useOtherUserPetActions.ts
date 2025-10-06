
import { useFeedOtherUserPet } from "./useFeedOtherUserPet";
import { useWaterOtherUserPet } from "./useWaterOtherUserPet";

interface UserProfile {
  id: string;
  paw_points: number;
  food_bags: number;
}

interface PetActions {
  feedPet: () => Promise<void>;
  waterPet: () => Promise<void>;
  isFeeding: boolean;
  isWatering: boolean;
}

export const useOtherUserPetActions = () => {
  const { feedOtherUserPet, isFeeding } = useFeedOtherUserPet();
  const { waterOtherUserPet, isWatering } = useWaterOtherUserPet();

  const createPetActions = (petId: string, currentWater: number, userProfile: UserProfile): PetActions => {
    return {
      feedPet: async () => {
        if (isFeeding(petId)) {
          return;
        }
        await feedOtherUserPet(petId, userProfile);
      },
      waterPet: async () => {
        if (isWatering(petId)) {
          return;
        }
        await waterOtherUserPet(petId, currentWater);
      },
      isFeeding: isFeeding(petId),
      isWatering: isWatering(petId)
    };
  };

  return { createPetActions };
};
