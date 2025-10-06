
import { calculateCurrentStats } from "./petHelpers";

// Check if pet should allow feeding based purely on database stats
export const shouldAllowFeeding = (pet: any): boolean => {
  console.log(`🍖 Checking feed allowance for ${pet.pet_name || pet.id}`);
  
  // Use calculated stats for accurate hunger assessment
  const currentStats = calculateCurrentStats(pet);
  
  // Allow feeding if hunger is below 100%
  const canFeed = currentStats.hunger < 100;
  
  console.log(`📊 Pet ${pet.pet_name}: DB hunger=${pet.hunger}, Calculated=${currentStats.hunger}, Can feed=${canFeed} (threshold: <100%)`);
  return canFeed;
};

export const shouldAllowWatering = (pet: any): boolean => {
  console.log(`💧 Checking water allowance for ${pet.pet_name || pet.id}`);
  
  // Use calculated stats for accurate water assessment
  const currentStats = calculateCurrentStats(pet);
  
  // Allow watering if water is below 100%
  const canWater = currentStats.water < 100;
  
  console.log(`📊 Pet ${pet.pet_name}: DB water=${pet.water}, Calculated=${currentStats.water}, Can water=${canWater} (threshold: <100%)`);
  return canWater;
};

// Get pet display stats - now relies purely on database values with time decay
export const getPetDisplayStats = (pet: any) => {
  return calculateCurrentStats(pet);
};

// Helper functions for better user feedback with time calculations
export const getNextFeedableTime = (pet: any): number => {
  const currentStats = calculateCurrentStats(pet);
  if (currentStats.hunger < 100) return 0; // Can feed now
  
  const lastFed = pet.last_fed ? new Date(pet.last_fed) : new Date();
  const now = new Date();
  const hoursSinceLastFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);
  
  // Pet will be feedable when hunger drops below 100%
  // Hunger decreases at 6.25 per hour (100/16 hours)
  const hungerToLose = currentStats.hunger - 100;
  const hoursNeeded = hungerToLose / 6.25;
  const totalHoursNeeded = hoursNeeded;
  
  return Math.max(0, Math.ceil((totalHoursNeeded - hoursSinceLastFed) * 60)); // Return minutes
};

export const getNextWaterableTime = (pet: any): number => {
  const currentStats = calculateCurrentStats(pet);
  if (currentStats.water < 100) return 0; // Can water now
  
  const lastWatered = pet.last_watered ? new Date(pet.last_watered) : new Date();
  const now = new Date();
  const hoursSinceLastWatered = (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60);
  
  // Pet will be waterable when water drops below 100%
  // Water decreases at 8.33 per hour (100/12 hours)
  const waterToLose = currentStats.water - 100;
  const hoursNeeded = waterToLose / 8.33;
  const totalHoursNeeded = hoursNeeded;
  
  return Math.max(0, Math.ceil((totalHoursNeeded - hoursSinceLastWatered) * 60)); // Return minutes
};

// Format time remaining helper
export const formatTimeRemaining = (minutes: number): string => {
  if (minutes <= 0) return "Now";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  
  return `${mins}m`;
};
