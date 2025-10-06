
import { useUnifiedFeedPet } from "./pet-actions/useUnifiedFeedPet";
import { useUnifiedWaterPet } from "./pet-actions/useUnifiedWaterPet";
import { useUnifiedBulkFeedPet } from "./pet-actions/useUnifiedBulkFeedPet";
import { useUnifiedBulkWaterPet } from "./pet-actions/useUnifiedBulkWaterPet";

export const usePetActions = () => {
  const { feedPet, isFeeding } = useUnifiedFeedPet();
  const { waterPet, isWatering } = useUnifiedWaterPet();
  const { bulkFeedPets, isBulkFeeding } = useUnifiedBulkFeedPet();
  const { bulkWaterPets, isBulkWatering } = useUnifiedBulkWaterPet();

  return { 
    feedPet, 
    waterPet, 
    isFeeding,
    isWatering,
    bulkFeedPets,
    bulkWaterPets,
    isBulkFeeding,
    isBulkWatering
  };
};
