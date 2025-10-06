
import { Button } from "@/components/ui/button";
import { Heart, Droplets } from "lucide-react";

interface PetCardActionsProps {
  pet: any;
  isOwnProfile?: boolean;
  targetUserId?: string;
  showButtons?: boolean;
  onFeed?: () => Promise<void>;
  onWater?: () => Promise<void>;
  isFeedingInProgress?: boolean;
  isWateringInProgress?: boolean;
}

const PetCardActions = ({ 
  pet, 
  isOwnProfile = false, 
  targetUserId,
  showButtons = true,
  onFeed,
  onWater,
  isFeedingInProgress = false,
  isWateringInProgress = false
}: PetCardActionsProps) => {

  const handleFeed = async () => {
    console.log(`🍖 PetCardActions: Feed button clicked for pet ${pet.id} (${pet.pet_name}) - Feeding: ${isFeedingInProgress}`);
    
    if (onFeed) {
      await onFeed();
    }
  };

  const handleWater = async () => {
    console.log(`💧 PetCardActions: Water button clicked for pet ${pet.id} (${pet.pet_name}) - Watering: ${isWateringInProgress}`);
    
    if (onWater) {
      await onWater();
    }
  };

  // Don't show buttons if explicitly disabled
  if (!showButtons) {
    return null;
  }

  return (
    <div className="flex gap-2 justify-center p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={handleFeed}
        disabled={isFeedingInProgress}
        className="flex items-center gap-1 px-3 py-2 hover:bg-green-50 hover:border-green-300 transition-colors text-sm font-medium flex-1"
      >
        <Heart className="w-4 h-4 text-red-500" />
        {isFeedingInProgress ? "Feeding..." : "Feed"}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleWater}
        disabled={isWateringInProgress}
        className="flex items-center gap-1 px-3 py-2 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium flex-1"
      >
        <Droplets className="w-4 h-4 text-blue-500" />
        {isWateringInProgress ? "Watering..." : "Water"}
      </Button>
    </div>
  );
};

export default PetCardActions;
