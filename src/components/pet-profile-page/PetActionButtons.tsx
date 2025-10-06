
import { Button } from "@/components/ui/button";
import { Heart, Droplets } from "lucide-react";

interface FeedPetResult {
  success: boolean;
  error?: string;
  newStats?: {
    hunger: number;
    water: number;
  };
}

interface WaterPetResult {
  success: boolean;
  error?: string;
  newStats?: {
    hunger: number;
    water: number;
  };
}

interface PetActionButtonsProps {
  pet: any;
  isOwnPet: boolean;
  onUpdate?: () => void;
  feedPet: (petId: string) => Promise<FeedPetResult>;
  waterPet: (petId: string) => Promise<WaterPetResult>;
  isFeeding: boolean;
  isWatering: boolean;
}

const PetActionButtons = ({ 
  pet, 
  isOwnPet, 
  feedPet, 
  waterPet, 
  isFeeding, 
  isWatering
}: PetActionButtonsProps) => {
  const handleFeed = async () => {
    await feedPet(pet.id);
    // No manual refresh - let the unified hooks handle cache invalidation automatically
  };

  const handleWater = async () => {
    await waterPet(pet.id);
    // No manual refresh - let the unified hooks handle cache invalidation automatically
  };

  return (
    <div className="flex gap-1">
      <Button
        onClick={handleFeed}
        disabled={isFeeding}
        size="sm"
        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white h-7 px-3 text-xs"
      >
        <Heart className="w-3 h-3 mr-1" />
        {isFeeding ? "Feeding..." : "Feed"}
      </Button>

      <Button
        onClick={handleWater}
        disabled={isWatering}
        size="sm"
        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-7 px-3 text-xs"
      >
        <Droplets className="w-3 h-3 mr-1" />
        {isWatering ? "Watering..." : "Water"}
      </Button>
    </div>
  );
};

export default PetActionButtons;
