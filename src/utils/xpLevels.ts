
export interface XPLevel {
  name: string;
  color: string;
  minXP: number;
}

export const XP_LEVELS: XPLevel[] = [
  { name: "PawNoobie", color: "text-gray-600", minXP: 0 },
  { name: "PawNovice", color: "text-pink-600", minXP: 25000 },
  { name: "PawApprentice", color: "text-red-600", minXP: 75000 },
  { name: "PawGuardian", color: "text-blue-600", minXP: 200000 },
  { name: "PawMaster", color: "text-orange-600", minXP: 500000 },
  { name: "PawMystic", color: "text-purple-600", minXP: 800000 },
  { name: "PawLegend", color: "text-yellow-600", minXP: 1200000 },
  { name: "PawGuru", color: "bg-black text-white", minXP: 2000000 },
];

export const getXPLevel = (xp: number): XPLevel => {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) {
      return XP_LEVELS[i];
    }
  }
  return XP_LEVELS[0];
};

export const getXPProgress = (xp: number): { current: number; next: number; percentage: number } => {
  const currentLevel = getXPLevel(xp);
  const currentLevelIndex = XP_LEVELS.findIndex(level => level.name === currentLevel.name);
  
  if (currentLevelIndex === XP_LEVELS.length - 1) {
    // Max level reached
    return { current: xp, next: xp, percentage: 100 };
  }
  
  const nextLevel = XP_LEVELS[currentLevelIndex + 1];
  const currentLevelXP = currentLevel.minXP;
  const nextLevelXP = nextLevel.minXP;
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const percentage = Math.min(100, (progressXP / requiredXP) * 100);
  
  return { current: progressXP, next: requiredXP, percentage };
};

export const getXPRangeDisplay = (level: XPLevel, nextLevel?: XPLevel): string => {
  if (!nextLevel) {
    return `${level.minXP.toLocaleString()}+ XP`;
  }
  return `${level.minXP.toLocaleString()}-${(nextLevel.minXP - 1).toLocaleString()} XP`;
};
