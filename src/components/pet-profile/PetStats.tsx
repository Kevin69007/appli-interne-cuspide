
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBreedStatConfig } from "@/utils/breedStatConfig";

interface PetStatsProps {
  pet: {
    friendliness: number;
    playfulness: number;
    energy: number;
    loyalty: number;
    curiosity: number;
    hunger?: number;
    water?: number;
    breed?: string;
    pets?: {
      name?: string;
    };
    extra_stats?: any;
  };
}

const PetStats = ({ pet }: PetStatsProps) => {
  const stats = [
    { name: "Friendliness", short: "Friend", value: pet.friendliness },
    { name: "Playfulness", short: "Play", value: pet.playfulness },
    { name: "Energy", short: "Energy", value: pet.energy },
    { name: "Loyalty", short: "Loyal", value: pet.loyalty },
    { name: "Curiosity", short: "Curious", value: pet.curiosity }
  ];

  console.log('🔍 PetStats - Raw pet data from database:', {
    friendliness: pet.friendliness,
    playfulness: pet.playfulness,
    energy: pet.energy,
    loyalty: pet.loyalty,
    curiosity: pet.curiosity,
    breed: pet.breed
  });

  // Get breed config for validation
  const breedConfig = pet.breed ? getBreedStatConfig(pet.breed) : null;
  
  return (
    <div className="flex justify-center w-full">
      <div className="space-y-4 w-full max-w-md">
        <div className="space-y-2">
          {stats.map((stat) => {
            // DISPLAY EXACT DATABASE VALUE - NO MODIFICATIONS WHATSOEVER
            const displayValue = stat.value;
            let isOutOfRange = false;
            let rangeType = '';
            
            if (breedConfig && stat.value !== null && stat.value !== undefined) {
              const statKey = stat.name.toLowerCase() as keyof typeof breedConfig;
              if (breedConfig[statKey]) {
                if (stat.value > breedConfig[statKey].max) {
                  isOutOfRange = true;
                  rangeType = 'over';
                  console.log(`⚠️ PetStats - ${stat.name} is over-stat: ${stat.value} > ${breedConfig[statKey].max}`);
                } else if (stat.value < breedConfig[statKey].min) {
                  isOutOfRange = true;
                  rangeType = 'under';
                  console.log(`⚠️ PetStats - ${stat.name} is under-stat: ${stat.value} < ${breedConfig[statKey].min}`);
                }
              }
            }
            
            // Calculate bar fill percentage based on breed ranges, but keep displayed number exact
            let percentage = Math.min(100, Math.max(0, displayValue));
            if (breedConfig && stat.value !== null && stat.value !== undefined) {
              const statKey = stat.name.toLowerCase() as keyof typeof breedConfig;
              const cfg = breedConfig[statKey as keyof typeof breedConfig] as { min: number; max: number } | undefined;
              if (cfg) {
                if (stat.value <= cfg.min) {
                  percentage = 0;
                } else if (stat.value >= cfg.max) {
                  percentage = 100;
                } else {
                  percentage = ((stat.value - cfg.min) / (cfg.max - cfg.min)) * 100;
                }
                percentage = Math.min(100, Math.max(0, percentage));
              }
            }
            
            console.log(`📊 PetStats - ${stat.name}: DATABASE_VALUE=${stat.value}, DISPLAYING=${displayValue}, BAR_PERCENT=${percentage.toFixed(1)}% (${isOutOfRange ? `${rangeType}-stat` : 'valid'})`);
            
            return (
              <div key={stat.name} className="flex items-center justify-between">
                <span className="text-xs font-medium w-16" title={stat.name}>{stat.short}</span>
                <div className="flex-1 mx-2 relative" style={{ minWidth: '120px' }}>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isOutOfRange ? 'bg-red-500' : 'bg-primary'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
                    style={{ left: `${Math.min(97.5, Math.max(2.5, percentage))}%` }}
                  >
                    <div className={`w-5 h-2 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm border ${
                      isOutOfRange ? 'bg-red-100 text-red-800 border-red-300' : 'bg-white text-gray-800 border-gray-300'
                    }`}>
                      <span className="drop-shadow-sm">{displayValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PetStats;
