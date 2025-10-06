
import { Progress } from "@/components/ui/progress";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { useRecentPetInteractions } from "@/hooks/useRecentPetInteractions";

interface PetStatsDisplayProps {
  pet: {
    id?: string;
    hunger?: number;
    water?: number;
    friendliness?: number;
    playfulness?: number;
    energy?: number;
    loyalty?: number;
    curiosity?: number;
    last_fed?: string;
    last_watered?: string;
  };
  isFeeding?: boolean;
  isWatering?: boolean;
}

const PetStatsDisplay = ({ pet, isFeeding = false, isWatering = false }: PetStatsDisplayProps) => {
  // Use the actual pet stats from the database
  const currentStats = calculateCurrentStats(pet);
  const { isFed, isWatered } = useRecentPetInteractions();
  
  // If we're currently feeding/watering OR recently interacted, show 100% for seamless UI
  // This ensures ALL pet interactions (own + other users) have the same behavior
  const displayHunger = (isFeeding || isFed(pet.id)) ? 100 : currentStats.hunger;
  const displayWater = (isWatering || isWatered(pet.id)) ? 100 : currentStats.water;

  console.log(`📊 PetStatsDisplay - ${pet.id || 'unknown'}: hunger=${Math.round(displayHunger)}%, water=${Math.round(displayWater)}% (${isFeeding ? 'FEEDING' : 'normal'}, ${isWatering ? 'WATERING' : 'normal'})`);

  return (
    <div className="space-y-2">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">Hunger</span>
          <span className="text-xs text-muted-foreground">{Math.round(displayHunger)}%</span>
        </div>
        <Progress 
          value={displayHunger} 
          className="h-1.5 [&>div]:bg-pink-500"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium">Water</span>
          <span className="text-xs text-muted-foreground">{Math.round(displayWater)}%</span>
        </div>
        <Progress 
          value={displayWater} 
          className="h-1.5 [&>div]:bg-blue-500"
        />
      </div>
    </div>
  );
};

export default PetStatsDisplay;
