
// Utility to migrate old stat names to new stat names
export const migrateOldStatNames = (extraStats: any): any => {
  if (!extraStats || typeof extraStats !== 'object') {
    return extraStats;
  }

  const statNameMapping: { [key: string]: string } = {
    // Map old stat names to new stat names
    'aggression': 'loyalty',
    'speed': 'energy',
    'strength': 'playfulness',
    'charisma': 'friendliness',
    'stamina': 'energy',
    'wit': 'curiosity',
    'charm': 'friendliness',
    'vigor': 'energy',
    'spirit': 'playfulness'
  };

  const migratedStats: any = {};
  
  Object.entries(extraStats).forEach(([oldStatName, value]) => {
    const newStatName = statNameMapping[oldStatName.toLowerCase()] || oldStatName;
    migratedStats[newStatName] = value;
  });

  return migratedStats;
};

// Get display name for stats (capitalize first letter)
export const getStatDisplayName = (statName: string): string => {
  return statName.charAt(0).toUpperCase() + statName.slice(1).toLowerCase();
};

// Validate if a stat name is one of the core stats
export const isCoreStatName = (statName: string): boolean => {
  const coreStats = ['friendliness', 'playfulness', 'energy', 'loyalty', 'curiosity'];
  return coreStats.includes(statName.toLowerCase());
};
