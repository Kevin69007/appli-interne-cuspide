import { useCallback } from "react";
import { useSyncExternalStore } from "react";
import { recentPetInteractions } from "@/state/recentPetInteractions";

export const useRecentPetInteractions = () => {
  // subscribe to store; value itself is not used, but changes trigger re-render
  useSyncExternalStore(
    recentPetInteractions.subscribe,
    recentPetInteractions.getSnapshot,
    recentPetInteractions.getSnapshot
  );

  const isFed = useCallback((petId: string | undefined) => {
    return petId ? recentPetInteractions.isFed(petId) : false;
  }, []);

  const isWatered = useCallback((petId: string | undefined) => {
    return petId ? recentPetInteractions.isWatered(petId) : false;
  }, []);

  return {
    isFed,
    isWatered,
    markFed: recentPetInteractions.markFed,
    markWatered: recentPetInteractions.markWatered,
  };
};
