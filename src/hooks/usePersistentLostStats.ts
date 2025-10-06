
import { useState, useEffect } from 'react';
import { LOSTIE_CONFIG } from '@/config/lostie';

interface LostStats {
  id: string;
  stats: {
    energy?: number;
    friendliness?: number;
    playfulness?: number;
    loyalty?: number;
    curiosity?: number;
  };
  foundAt: Date;
  petId: string;
}

export const usePersistentLostStats = () => {
  const [foundStats, setFoundStats] = useState<LostStats[]>([]);

  // Load found stats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('foundLostStats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFoundStats(parsed.map((stat: any) => ({
          ...stat,
          foundAt: new Date(stat.foundAt)
        })));
      } catch (error) {
        console.error('Error loading found stats:', error);
      }
    }
  }, []);

  // Save to localStorage whenever foundStats changes
  useEffect(() => {
    localStorage.setItem('foundLostStats', JSON.stringify(foundStats));
  }, [foundStats]);

  const addFoundStat = (stat: LostStats) => {
    setFoundStats(prev => [...prev, stat]);
  };

  const hasFoundStatForPet = (petId: string) => {
    return foundStats.some(stat => stat.petId === petId);
  };

  // Balanced chance to find lost stats - now 0.01% (1 in 10,000)
  const tryFindLostStats = (petId: string) => {
    if (hasFoundStatForPet(petId)) {
      return null; // Already found stats for this pet
    }

    // Use configured gameplay find chance
    const findChance = Math.random();
    if (findChance > LOSTIE_CONFIG.GAMEPLAY_FIND_CHANCE) {
      return null;
    }

    // Generate random lost stats (1 point each)
    const possibleStats = ['energy', 'friendliness', 'playfulness', 'loyalty', 'curiosity'];
    const numStats = 1; // Always only 1 stat
    const selectedStats = possibleStats
      .sort(() => 0.5 - Math.random())
      .slice(0, numStats);

    const stats: any = {};
    selectedStats.forEach(stat => {
      stats[stat] = 1; // Always 1 point
    });

    const lostStat: LostStats = {
      id: crypto.randomUUID(),
      stats,
      foundAt: new Date(),
      petId
    };

    addFoundStat(lostStat);
    return lostStat;
  };

  const clearFoundStats = () => {
    setFoundStats([]);
    localStorage.removeItem('foundLostStats');
  };

  // Add the missing methods that AdoptPet.tsx expects
  const generateStatTypesForPet = (petId: string) => {
    return ['normal', 'normal', 'normal', 'normal', 'normal'] as ('normal' | 'lost')[];
  };

  const petHasLostStats = (petId: string) => {
    return hasFoundStatForPet(petId);
  };

  const resetLostStats = () => {
    clearFoundStats();
  };

  return {
    foundStats,
    tryFindLostStats,
    hasFoundStatForPet,
    clearFoundStats,
    generateStatTypesForPet,
    petHasLostStats,
    resetLostStats
  };
};
