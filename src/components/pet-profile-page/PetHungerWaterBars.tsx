
import { Progress } from "@/components/ui/progress";
import { calculateCurrentStats } from "@/utils/petHelpers";
import { useRecentPetInteractions } from "@/hooks/useRecentPetInteractions";

interface PetHungerWaterBarsProps {
  pet: {
    id?: string;
    hunger?: number;
    water?: number;
    last_fed?: string;
    last_watered?: string;
  };
  isFeeding?: boolean;
  isWatering?: boolean;
}

const PetHungerWaterBars = ({ pet, isFeeding = false, isWatering = false }: PetHungerWaterBarsProps) => {
  const currentStats = calculateCurrentStats(pet);
  const { isFed, isWatered } = useRecentPetInteractions();
  
  // Use the exact same logic as PetStatsDisplay - seamless UI for ALL pets
  const displayHunger = (isFeeding || isFed(pet.id)) ? 100 : currentStats.hunger;
  const displayWater = (isWatering || isWatered(pet.id)) ? 100 : currentStats.water;

  console.log(`📊 PetHungerWaterBars - ${pet.id || 'unknown'}: hunger=${Math.round(displayHunger)}%, water=${Math.round(displayWater)}% (${isFeeding ? 'FEEDING' : 'normal'}, ${isWatering ? 'WATERING' : 'normal'})`);

  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200 rounded-lg p-3 h-24 flex flex-col justify-center" aria-live="polite" aria-atomic="true">
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
    </div>
  );
};

export default PetHungerWaterBars;
