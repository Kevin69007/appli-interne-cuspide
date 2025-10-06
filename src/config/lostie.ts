// Configuration for lostie (lost stat) generation chances
export const LOSTIE_CONFIG = {
  // Chance to find a lost stat on the Play/Adopt page (1 in 10,000)
  PLAY_PAGE_CHANCE: 0.0001,
  
  // Chance during gameplay interactions (keep existing rate from usePersistentLostStats)
  GAMEPLAY_FIND_CHANCE: 0.0001
} as const;
