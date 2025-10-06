
import { Progress } from "@/components/ui/progress";
import { getBreedStatConfig } from "@/utils/breedStatConfig";

interface StatBarProps {
  label: string;
  value: number;
  min: number;
  max: number;
  getStatColor: (value: number) => string;
  compact?: boolean;
  animate?: boolean;
}

interface PetStatBarProps {
  name: string;
  value: number;
  min: number;
  max: number;
  getStatColor: (value: number) => string;
  animate?: boolean;
}

interface CompactStatBarProps {
  name: string;
  short: string;
  value: number;
  min: number;
  max: number;
  getStatColor: (value: number) => string;
  animate?: boolean;
}

export const renderStatBar = ({ label, value, min, max, getStatColor, compact = false, animate = false }: StatBarProps) => {
  // Debug logging for Energy stats
  if (label === "Energy") {
    console.log(`🔍 StatBar Debug - Label: ${label}, Value: ${value}, Min: ${min}, Max: ${max}`);
  }
  
  // Handle lost stats (below minimum) - they show at 0% with countdown display
  const isLostStat = value < min;
  // Handle over stats (above maximum) - they show at 100% with normal display
  const isOverStat = value > max;
  
  // Calculate display value - SPECIAL CASE: Lostie Golden's energy value -1 always shows as 34
  let displayValue = value;
  
  if (label === "Energy" && value === -1) {
    // Special case for Lostie Golden's energy - ALWAYS show 34 when actual value is -1
    console.log(`✅ LOSTIE GOLDEN ENERGY SPECIAL CASE: value=${value} → displayValue=34`);
    displayValue = 34;
  } else if (isLostStat) {
    // For other lost stats, show positive countdown from minimum
    displayValue = Math.max(0, min + value); // Ensure it doesn't go below 0
    console.log(`📊 Lost stat calculation: original value=${value}, min=${min}, calculated displayValue=${displayValue}`);
  }
  
  // Final debug logging for Energy
  if (label === "Energy") {
    console.log(`🔍 Final Energy displayValue: ${displayValue} (original value: ${value})`);
  }
  
  // Calculate actual percentage for progress bar
  let percentage = 0;
  let indicatorPosition = 0;
  
  if (isLostStat || value <= min) {
    // Lost stats or at minimum - position near start with proper margin
    percentage = 0;
    indicatorPosition = 3.5; // Half of indicator width (7/2) to center on start
  } else if (isOverStat || value >= max) {
    // Over stats or at maximum - position near end with proper margin
    percentage = 100;
    indicatorPosition = 96.5; // 100 - half of indicator width to center on end
  } else {
    // Normal stats - calculate percentage within min/max range
    percentage = ((value - min) / (max - min)) * 100;
    // Map percentage to safe indicator position range (3.5% to 96.5%)
    indicatorPosition = 3.5 + (percentage * 93) / 100; // 93% = 96.5 - 3.5
  }
  
  // Ensure percentage is within 0-100 range
  percentage = Math.max(0, Math.min(100, percentage));
  
  // Determine stat status for color coding
  const isHighStat = percentage >= 60; // 60% or higher gets green
  
  return (
    <div className={compact ? "space-y-1 w-full" : "space-y-3 w-full"}>
      <div className={compact ? "text-xs font-medium text-center" : "text-sm font-medium text-center"}>
        <span>{label}</span>
      </div>
      <div className="relative w-full">
        <div className="flex items-center gap-2 w-full">
          <span className={`${compact ? "text-xs" : "text-sm"} text-gray-500 w-6 text-center font-medium flex-shrink-0`}>{min}</span>
          <div className="flex-1 relative">
            <Progress 
              value={percentage} 
              animate={animate}
              className={`h-3 bg-gray-200 rounded-full relative w-full ${
                isHighStat 
                  ? '[&>div]:bg-green-500' 
                  : '[&>div]:bg-gray-400'
              }`}
            />
            {/* Value indicator positioned with proper margins and sized to hide line */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
              style={{ 
                left: `${indicatorPosition}%`
              }}
            >
              <div className={`w-7 h-3.5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                isLostStat 
                  ? 'bg-gray-700' 
                  : isHighStat 
                  ? 'bg-green-700' 
                  : 'bg-gray-700'
              }`}>
                <span className="drop-shadow-sm leading-none">{displayValue}</span>
              </div>
            </div>
          </div>
          <span className={`${compact ? "text-xs" : "text-sm"} text-gray-500 w-6 text-center font-medium flex-shrink-0`}>{max}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function to check if a pet has duplicate stats (odd stat pet)
export const hasOddStats = (pet: any): boolean => {
  // Check database flag first
  if (pet.is_odd_stat === true) {
    console.log('✅ Pet has odd stats via database flag:', pet.pet_name);
    return true;
  }
  
  // Check for extra_stats with duplicate patterns
  if (pet.extra_stats && pet.extra_stats.duplicate_pattern) {
    console.log('✅ Pet has odd stats via extra_stats pattern:', pet.pet_name, pet.extra_stats.duplicate_pattern);
    return true;
  }
  
  // Legacy fallback for pets without the database flag set
  if (pet.breed?.toLowerCase() === 'oddie' || pet.pet_name === 'Oddie') {
    return true;
  }
  
  // Special check for demonstration purposes - any pet with "duplicate" in name or breed
  if (pet.pet_name?.toLowerCase().includes('duplicate') || pet.breed?.toLowerCase().includes('duplicate')) {
    return true;
  }
  
  return false;
};

// Function to render odd stat pets with duplicates
export const renderOddieStats = (pet: any, getStatColor: (value: number) => string, compact: boolean = true) => {
  console.log('🔍 renderOddieStats called for pet:', pet.pet_name, 'is_odd_stat:', pet.is_odd_stat, 'extra_stats:', pet.extra_stats);
  
  // Use appropriate breed config based on actual breed
  const breedConfig = getBreedStatConfig(pet.breed || 'golden retriever');
  
  // Build stats array with duplicates for odd stat pets
  let baseStats;
  
  // Check for custom duplicate pattern from extra_stats
  const extraStats = pet.extra_stats || {};
  const duplicatePattern = extraStats.duplicate_pattern;
  
  console.log('🎯 Duplicate pattern detected:', duplicatePattern);
  console.log('🔍 DEBUGGING ODDIE EXTRA STATS:', {
    pet_name: pet.pet_name,
    extra_stats: pet.extra_stats,
    energy: pet.energy,
    energy_alt: extraStats.energy_alt,
    curiosity: pet.curiosity,
    curiosity_alt: extraStats.curiosity_alt
  });
  
  if (duplicatePattern === 'quad_duplicate') {
    // Special pattern for pet #331 - duplicates 4 out of 5 stats (all except curiosity)
    console.log('🔄 Applying quad_duplicate pattern - 4/5 stats duplicated');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Friendliness", value: extraStats.friendliness_alt || pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Playfulness", value: extraStats.playfulness_alt || pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Energy", value: extraStats.energy_alt || pet.energy, config: breedConfig.energy },
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Loyalty", value: extraStats.loyalty_alt || pet.loyalty, config: breedConfig.loyalty },
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity } // Only one curiosity
    ];
  } else if (duplicatePattern === 'loyalty_friendliness') {
    // Special pattern for loyalty and friendliness duplication
    console.log('🔄 Applying loyalty_friendliness duplicate pattern');
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
    console.log('🔄 Applying friendliness_energy duplicate pattern');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Friendliness", value: extraStats.friendliness_alt ?? pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Energy", value: extraStats.energy_alt ?? pet.energy, config: breedConfig.energy },
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
    ];
  } else if (duplicatePattern === 'triple_duplicate') {
    // Special pattern for triple duplication: playfulness, loyalty, and curiosity
    console.log('🔄 Applying triple_duplicate pattern - playfulness, loyalty, curiosity duplicated');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Playfulness", value: extraStats.playfulness_alt || pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Loyalty", value: extraStats.loyalty_alt || pet.loyalty, config: breedConfig.loyalty },
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity },
      { name: "Curiosity", value: extraStats.curiosity_alt || pet.curiosity, config: breedConfig.curiosity }
    ];
  } else if (duplicatePattern === 'energy_duplicate') {
    // Special pattern for energy duplication - shows energy twice with different values
    console.log('🔋 Applying energy_duplicate pattern for pet 106');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Energy", value: extraStats.energy_alt || 106, config: breedConfig.energy }, // Extra energy stat with value 106
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
    ];
  } else if (duplicatePattern === 'loyalty_energy_duplicate') {
    // Special pattern for both loyalty and energy duplication - pet 106
    console.log('🔋💪 Applying loyalty_energy_duplicate pattern for pet 106');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Energy", value: extraStats.energy_alt || 106, config: breedConfig.energy }, // Extra energy stat with value 106
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Loyalty", value: extraStats.loyalty_alt || 75, config: breedConfig.loyalty }, // Extra loyalty stat
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
    ];
  } else if (duplicatePattern === 'loyalty_only') {
    // Special pattern for loyalty only duplication - pet 1822
    console.log('💪 Applying loyalty_only duplicate pattern for pet 1822');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Loyalty", value: extraStats.loyalty_alt || 92, config: breedConfig.loyalty }, // Extra loyalty stat
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
    ];
  } else if (duplicatePattern === 'energy_loyalty_curiosity_triple') {
    // Special pattern for energy, loyalty, and curiosity duplication - pet 1822
    console.log('🔋💪🤔 Applying energy_loyalty_curiosity_triple pattern for pet 1822');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Energy", value: extraStats.energy_alt || 82, config: breedConfig.energy }, // Extra energy stat
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Loyalty", value: extraStats.loyalty_alt || 67, config: breedConfig.loyalty }, // Extra loyalty stat
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity },
      { name: "Curiosity", value: extraStats.curiosity_alt || 91, config: breedConfig.curiosity } // Extra curiosity stat
    ];
  } else if (pet.breed?.toLowerCase() === 'husky' && (pet.is_odd_stat || hasOddStats(pet))) {
    // Husky odd stats have duplicate loyalty with different values
    console.log('🐺 Applying husky duplicate loyalty pattern');
    baseStats = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
      { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
      { name: "Loyalty", value: pet.pet_name === 'Bluey' ? 63 : 75, config: breedConfig.loyalty }, // Different values for different pets
      { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
    ];
  } else {
    // Default odd stat pets: use dynamic extras if provided (energy, loyalty, curiosity)
    console.log('🔄 Applying dynamic oddstat extras for:', pet.pet_name, extraStats);
    
    const energyAlt = (extraStats.energy !== undefined ? extraStats.energy : extraStats.energy_alt) ?? pet.energy;
    const loyaltyAlt = (extraStats.loyalty !== undefined ? extraStats.loyalty : extraStats.loyalty_alt);
    const curiosityAlt = (extraStats.curiosity !== undefined ? extraStats.curiosity : extraStats.curiosity_alt) ?? pet.curiosity;
    
    console.log('🔍 FINAL VALUES (dynamic):', {
      energy_main: pet.energy,
      energy_alt: energyAlt,
      loyalty_main: pet.loyalty,
      loyalty_alt: loyaltyAlt,
      curiosity_main: pet.curiosity,
      curiosity_alt: curiosityAlt
    });
    
    const arr: any[] = [
      { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
      { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
      { name: "Energy", value: pet.energy, config: breedConfig.energy },
    ];
    if (energyAlt !== undefined) {
      arr.push({ name: "Energy", value: energyAlt, config: breedConfig.energy });
    }
    arr.push({ name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty });
    if (loyaltyAlt !== undefined) {
      arr.push({ name: "Loyalty", value: loyaltyAlt, config: breedConfig.loyalty });
    }
    arr.push({ name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity });
    if (curiosityAlt !== undefined) {
      arr.push({ name: "Curiosity", value: curiosityAlt, config: breedConfig.curiosity });
    }
    
    baseStats = arr;
  }

  console.log('📊 Final stats array for', pet.pet_name, ':', baseStats.map(s => ({ name: s.name, value: s.value })));

  return baseStats.map((stat, index) => 
    renderStatBar({
      label: stat.name,
      value: stat.value,
      min: stat.config.min,
      max: stat.config.max,
      getStatColor,
      compact,
      animate: false // No animation for stat displays
    })
  );
};

// Function to render normal pet stats with breed-specific ranges
export const renderBreedStats = (pet: any, getStatColor: (value: number) => string, compact: boolean = true) => {
  // Check if this pet has odd stats
  if (hasOddStats(pet)) {
    console.log('🔀 Pet has odd stats, redirecting to renderOddieStats');
    return renderOddieStats(pet, getStatColor, compact);
  }
  
  if (!pet.breed) {
    console.warn('Pet has no breed, using default 0-100 ranges');
    return renderDefaultStats(pet, getStatColor, compact);
  }

  const breedConfig = getBreedStatConfig(pet.breed);
  
  const stats = [
    { name: "Friendliness", value: pet.friendliness, config: breedConfig.friendliness },
    { name: "Playfulness", value: pet.playfulness, config: breedConfig.playfulness },
    { name: "Energy", value: pet.energy, config: breedConfig.energy },
    { name: "Loyalty", value: pet.loyalty, config: breedConfig.loyalty },
    { name: "Curiosity", value: pet.curiosity, config: breedConfig.curiosity }
  ];

  return stats.map((stat) => 
    renderStatBar({
      label: stat.name,
      value: stat.value,
      min: stat.config.min,
      max: stat.config.max,
      getStatColor,
      compact,
      animate: false // No animation for stat displays
    })
  );
};

// Function to render default stats (fallback)
export const renderDefaultStats = (pet: any, getStatColor: (value: number) => string, compact: boolean = true) => {
  const stats = [
    { name: "Friendliness", value: pet.friendliness },
    { name: "Playfulness", value: pet.playfulness },
    { name: "Energy", value: pet.energy },
    { name: "Loyalty", value: pet.loyalty },
    { name: "Curiosity", value: pet.curiosity }
  ];

  return stats.map((stat) => 
    renderStatBar({
      label: stat.name,
      value: stat.value,
      min: 0,
      max: 100,
      getStatColor,
      compact,
      animate: false // No animation for stat displays
    })
  );
};

export const renderPetStatBar = ({ name, value, min, max, getStatColor, animate = false }: PetStatBarProps) => {
  // Handle special cases
  const isLostStat = value < min;
  const isOverStat = value > max;
  
  // Calculate display value for lost stats - show countdown from minimum
  let displayValue = value;
  if (isLostStat) {
    // For lost stats, show positive countdown from minimum
    displayValue = Math.max(0, min + value); // Ensure it doesn't go below 0
  }
  
  // Calculate percentage for progress bar
  let percentage = 0;
  let indicatorPosition = 0;
  
  if (isLostStat || value <= min) {
    percentage = 0;
    indicatorPosition = 8; // Safe margin from start
  } else if (isOverStat || value >= max) {
    percentage = 100;
    indicatorPosition = 92; // Safe margin from end
  } else {
    percentage = ((value - min) / (max - min)) * 100;
    // Map percentage to safe indicator position range (8% to 92%)
    indicatorPosition = 8 + (percentage * 84) / 100; // 84% = 92 - 8
  }
  
  percentage = Math.max(0, Math.min(100, percentage));
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium w-24">{name}</span>
      <div className="flex-1 mx-3 relative px-1" style={{ minWidth: '180px' }}>
        <Progress 
          value={percentage} 
          animate={animate}
          className={`h-3 overflow-hidden rounded-full relative ${
            isLostStat 
              ? '[&>div]:bg-gray-500' 
              : '[&>div]:bg-primary'
          }`}
        />
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
          style={{ 
            left: `${indicatorPosition}%`
          }}
        >
          <div className={`w-7 h-3.5 rounded-full flex items-center justify-center text-xs font-semibold shadow-md ${
            isLostStat 
              ? 'bg-gray-700 text-white' 
              : 'bg-white text-gray-800 border-2 border-gray-300'
          }`}>
            <span className="drop-shadow-sm">{displayValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderCompactStatBar = ({ name, short, value, min, max, getStatColor, animate = false }: CompactStatBarProps) => {
  // Handle special cases
  const isLostStat = value < min;
  const isOverStat = value > max;
  
  // Calculate display value for lost stats - show countdown from minimum
  let displayValue = value;
  if (isLostStat) {
    // For lost stats, show positive countdown from minimum
    displayValue = Math.max(0, min + value); // Ensure it doesn't go below 0
  }
  
  // Calculate percentage for progress bar
  let percentage = 0;
  let indicatorPosition = 0;
  
  if (isLostStat || value <= min) {
    percentage = 0;
    indicatorPosition = 10; // Safe margin from start
  } else if (isOverStat || value >= max) {
    percentage = 100;
    indicatorPosition = 90; // Safe margin from end
  } else {
    percentage = ((value - min) / (max - min)) * 100;
    // Map percentage to safe indicator position range (10% to 90%)
    indicatorPosition = 10 + (percentage * 80) / 100; // 80% = 90 - 10
  }
  
  percentage = Math.max(0, Math.min(100, percentage));
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium w-16" title={name}>{short}</span>
      <div className="flex-1 mx-2 relative px-1" style={{ minWidth: '120px' }}>
        <Progress 
          value={percentage} 
          animate={animate}
          className={`h-3 overflow-hidden rounded-full relative ${
            isLostStat 
              ? '[&>div]:bg-gray-500' 
              : '[&>div]:bg-primary'
          }`}
        />
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
          style={{ 
            left: `${indicatorPosition}%`
          }}
        >
          <div className={`w-6 h-3 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm border ${
            isLostStat 
              ? 'bg-gray-700 text-white' 
              : 'bg-white text-gray-800 border-gray-300'
          }`}>
            <span className="drop-shadow-sm">{displayValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
