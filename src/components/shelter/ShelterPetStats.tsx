
import { getBreedStatConfig } from "@/utils/breedStatConfig";
import { Progress } from "@/components/ui/progress";
import { hasOddStats } from "@/utils/statBarUtils";

interface ShelterPetStatsProps {
  pet: any;
}

const ShelterPetStats = ({ pet }: ShelterPetStatsProps) => {
  console.log('🏠 ShelterPetStats rendering for pet:', pet.pet_name, 'breed:', pet.breed);

  const getStatColor = (value: number) => {
    if (value < 0) return "bg-purple-500"; // Lost stats
    if (value >= 60) return "bg-green-500";
    return "bg-gray-400";
  };

  // Check if this is an odd stat pet
  const isOddStatPet = hasOddStats(pet);

  // Determine which breed config to use
  let breedConfig;
  if (isOddStatPet) {
    if (pet.pet_name === 'Moose' && pet.breed?.toLowerCase() === 'husky') {
      breedConfig = getBreedStatConfig('husky');
    } else {
      breedConfig = getBreedStatConfig('golden retriever'); // For Oddie
    }
  } else {
    breedConfig = getBreedStatConfig(pet.breed || 'mixed');
  }

  // Build stats array
  let baseStats;
  if (isOddStatPet) {
    // Check for custom duplicate pattern from extra_stats
    const extraStats = pet.extra_stats || {};
    const duplicatePattern = extraStats.duplicate_pattern;
    
    if (duplicatePattern === 'loyalty_friendliness') {
      // Special pattern for loyalty and friendliness duplication (like pet #798)
      baseStats = [
        { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
        { name: "Friendliness", value: extraStats.friendliness_alt || pet.friendliness, config: breedConfig.friendliness },
        { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
        { name: "Energy", value: pet.energy, config: breedConfig.energy },
        { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
        { name: "Loyalty", value: extraStats.loyalty_alt || pet.loyalty, config: breedConfig.loyalty },
        { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
      ];
    } else if (duplicatePattern === 'friendliness_energy') {
      // Duplicate Friendliness and Energy (e.g., pet #95)
      baseStats = [
        { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
        { name: "Friendliness", value: extraStats.friendliness_alt ?? pet.friendliness, config: breedConfig.friendliness },
        { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
        { name: "Energy", value: pet.energy, config: breedConfig.energy },
        { name: "Energy", value: extraStats.energy_alt ?? pet.energy, config: breedConfig.energy },
        { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
        { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
      ];
    } else if (pet.pet_name === 'Moose' && pet.breed?.toLowerCase() === 'husky') {
      // Moose has duplicate loyalty with different values
      baseStats = [
        { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
        { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
        { name: "Energy", value: pet.energy, config: breedConfig.energy },
        { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
        { name: "Loyalty", value: 75, config: breedConfig.loyalty }, // Second loyalty with different value
        { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
      ];
    } else {
      // Handle pets with extra_stats containing different values for duplicate stats
      const extraStats = pet.extra_stats || {};
      baseStats = [
        { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
        { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
        { name: "Energy", value: pet.energy, config: breedConfig.energy },
        { name: "Energy", value: extraStats.energy || pet.energy, config: breedConfig.energy },
        { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
        { name: "Loyalty", value: extraStats.loyalty || pet.loyalty, config: breedConfig.loyalty },
        { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity },
        { name: "Curiosity", value: extraStats.curiosity || pet.curiosity, config: breedConfig.curiosity }
      ];
    }
  } else {
    // Normal pets
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
    ];
  }

  return (
    <div className="bg-pink-50 p-2 sm:p-3 rounded-lg space-y-1 sm:space-y-2">
      <h4 className="text-xs sm:text-sm font-medium text-pink-800 mb-2 text-center">Personality Traits</h4>
      <div className="space-y-1 sm:space-y-2">
        {baseStats.map((stat, index) => {
          // Handle special cases
          const isLostStat = stat.value < stat.config.min;
          const isOverStat = stat.value > stat.config.max;
          
          // Calculate display value - SPECIAL CASE: Lostie Golden's energy value -1 always shows as 34
          let displayValue = stat.value;
          
          if (stat.name === "Energy" && stat.value === -1) {
            displayValue = 34;
          } else if (isLostStat) {
            displayValue = Math.max(0, stat.config.min + stat.value);
          }
          
          // Calculate percentage for progress bar
          let percentage = 0;
          let indicatorPosition = 0;
          
          if (isLostStat || stat.value <= stat.config.min) {
            percentage = 0;
            indicatorPosition = 3.5; // Half of indicator width to center on start
          } else if (isOverStat || stat.value >= stat.config.max) {
            percentage = 100;
            indicatorPosition = 96.5; // 100 - half of indicator width to center on end
          } else {
            percentage = ((stat.value - stat.config.min) / (stat.config.max - stat.config.min)) * 100;
            // Map percentage to safe indicator position range (3.5% to 96.5%)
            indicatorPosition = 3.5 + (percentage * 93) / 100; // 93% = 96.5 - 3.5
          }
          
          percentage = Math.max(0, Math.min(100, percentage));
          
          // Determine if it's a high stat for color coding
          const isHighStat = percentage >= 60;

          return (
            <div key={index} className="space-y-1">
              <div className="text-xs font-medium text-center">
                <span>{stat.name}</span>
              </div>
              <div className="relative">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-xs text-gray-500 w-6 sm:w-8 text-center font-medium flex-shrink-0">{stat.config.min}</span>
                  <div className="flex-1 relative min-w-0" style={{ minWidth: '120px' }}>
                    <Progress 
                      value={percentage} 
                      className={`h-3 bg-gray-200 overflow-hidden rounded-full ${
                        isHighStat 
                          ? '[&>div]:bg-green-500' 
                          : '[&>div]:bg-gray-400'
                      }`}
                    />
                    {/* Oval value indicator positioned within the bar */}
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
                      style={{ left: `${indicatorPosition}%` }}
                    >
                      <div className={`w-6 h-3 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                        isLostStat 
                          ? 'bg-gray-700' 
                          : isHighStat 
                          ? 'bg-green-700' 
                          : 'bg-gray-700'
                      }`}>
                        <span className="drop-shadow-sm">{displayValue}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-6 sm:w-8 text-center font-medium flex-shrink-0">{stat.config.max}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShelterPetStats;
