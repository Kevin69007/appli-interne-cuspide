
import { validateAndCorrectPetStats } from "./petStatValidator";

export const calculateCurrentStats = (pet: any) => {
  if (!pet) return pet;

  const now = new Date();
  const lastFed = pet.last_fed ? new Date(pet.last_fed) : now;
  const lastWatered = pet.last_watered ? new Date(pet.last_watered) : now;
  
  const hoursWithoutFood = Math.floor((now.getTime() - lastFed.getTime()) / (1000 * 60 * 60));
  const hoursWithoutWater = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60));
  
  console.log(`🧮 Pet ${pet.pet_name || pet.id}: Hours without food: ${hoursWithoutFood}, Hours without water: ${hoursWithoutWater}`);
  
  // EXTENDED GRACE PERIOD: 30 minutes for global feeding/watering visibility
  // This ensures that when someone feeds/waters a pet, ALL users see it as fed/watered
  const gracePeriodHours = 0.5; // 30 minutes grace period
  
  // Calculate current hunger (decreases to 0 over 16 hours: 100/16 = 6.25 per hour)
  const hungerDecreaseRate = 100 / 16;
  let currentHunger;
  
  if (pet.hunger >= 100 && hoursWithoutFood < gracePeriodHours) {
    // Pet was recently fed to 100% - show as full regardless of who fed them
    currentHunger = 100;
    console.log(`🍖 Pet ${pet.pet_name || pet.id}: In grace period, showing 100% hunger (DB: ${pet.hunger}, hours: ${hoursWithoutFood})`);
  } else {
    currentHunger = Math.max(0, (pet.hunger || 100) - (hoursWithoutFood * hungerDecreaseRate));
    console.log(`🍖 Pet ${pet.pet_name || pet.id}: NOT in grace period, calculated hunger: ${currentHunger} (DB: ${pet.hunger}, hours: ${hoursWithoutFood})`);
  }
  
  // Calculate current water (decreases to 0 over 12 hours: 100/12 = ~8.33 per hour)
  const waterDecreaseRate = 100 / 12;
  let currentWater;
  
  if (pet.water >= 100 && hoursWithoutWater < gracePeriodHours) {
    // Pet was recently watered to 100% - show as full regardless of who watered them
    currentWater = 100;
    console.log(`💧 Pet ${pet.pet_name || pet.id}: In grace period, showing 100% water (DB: ${pet.water}, hours: ${hoursWithoutWater})`);
  } else {
    currentWater = Math.max(0, (pet.water || 100) - (hoursWithoutWater * waterDecreaseRate));
    console.log(`💧 Pet ${pet.pet_name || pet.id}: NOT in grace period, calculated water: ${currentWater} (DB: ${pet.water}, hours: ${hoursWithoutWater})`);
  }

  console.log(`📊 Pet ${pet.pet_name || pet.id}: Calculated hunger: ${currentHunger}, Calculated water: ${currentWater}`);

  // CRITICAL FIX: Preserve exact personality stats from database - DO NOT modify them
  // These stats should NEVER be changed during hunger/water calculations
  const preservedStats = {
    friendliness: pet.friendliness,
    playfulness: pet.playfulness,
    energy: pet.energy,
    loyalty: pet.loyalty,
    curiosity: pet.curiosity
  };

  console.log(`🔒 PRESERVING PERSONALITY STATS for ${pet.pet_name || pet.id}:`, preservedStats);

  return {
    ...pet,
    hunger: Math.round(currentHunger),
    water: Math.round(currentWater),
    // Preserve exact personality stat values from database (especially for collected babies)
    // These are the permanent traits of the pet and should never change
    ...preservedStats
  };
};

export const getTimeUntilNextFeed = (lastFed: string) => {
  const now = new Date();
  const lastFeedTime = new Date(lastFed);
  const timeSinceLastFeed = now.getTime() - lastFeedTime.getTime();
  const fourHoursInMs = 4 * 60 * 60 * 1000;
  
  if (timeSinceLastFeed >= fourHoursInMs) {
    return 0; // Can feed now
  }
  
  const timeRemaining = fourHoursInMs - timeSinceLastFeed;
  return Math.ceil(timeRemaining / (60 * 1000)); // Return minutes remaining
};

export const formatTimeRemaining = (minutes: number) => {
  if (minutes <= 0) return "Now";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  
  return `${mins}m`;
};

export const capitalizePetName = (name: string) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export const getGenderIcon = (gender: string) => {
  switch (gender?.toLowerCase()) {
    case 'male':
      return '♂';
    case 'female':
      return '♀';
    default:
      return '';
  }
};

export const getGenderColor = (gender: string) => {
  switch (gender?.toLowerCase()) {
    case 'male':
      return 'text-blue-600';
    case 'female':
      return 'text-pink-600';
    default:
      return 'text-gray-600';
  }
};
