// Global store for recent pet interactions (feed/water) with 30-minute TTL
// Uses a lightweight subscribe/getSnapshot pattern compatible with useSyncExternalStore

type Listener = () => void;

const listeners = new Set<Listener>();

const FED = new Map<string, number>(); // petId -> expiry timestamp (ms)
const WATERED = new Map<string, number>();

let version = 0; // increment to notify subscribers

const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

const cleanupIfExpired = (map: Map<string, number>, petId: string) => {
  const expiry = map.get(petId);
  if (expiry && Date.now() > expiry) {
    map.delete(petId);
    emit();
  }
};

const scheduleExpiry = (petId: string, kind: "fed" | "watered", ttlMs: number) => {
  setTimeout(() => {
    if (kind === "fed") {
      cleanupIfExpired(FED, petId);
    } else {
      cleanupIfExpired(WATERED, petId);
    }
  }, ttlMs + 50); // small buffer to ensure expiry has passed
};

const DEFAULT_TTL_MINUTES = 30;

export const recentPetInteractions = {
  // subscription for useSyncExternalStore
  subscribe(cb: Listener) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot() {
    return version;
  },
  // mutation helpers
  markFed(petId: string, minutes: number = DEFAULT_TTL_MINUTES) {
    if (!petId) return;
    const ttlMs = minutes * 60_000;
    FED.set(petId, Date.now() + ttlMs);
    scheduleExpiry(petId, "fed", ttlMs);
    emit();
  },
  markWatered(petId: string, minutes: number = DEFAULT_TTL_MINUTES) {
    if (!petId) return;
    const ttlMs = minutes * 60_000;
    WATERED.set(petId, Date.now() + ttlMs);
    scheduleExpiry(petId, "watered", ttlMs);
    emit();
  },
  // query helpers
  isFed(petId: string) {
    if (!petId) return false;
    cleanupIfExpired(FED, petId);
    return FED.has(petId);
  },
  isWatered(petId: string) {
    if (!petId) return false;
    cleanupIfExpired(WATERED, petId);
    return WATERED.has(petId);
  },
  clearPet(petId: string) {
    FED.delete(petId);
    WATERED.delete(petId);
    emit();
  }
};
