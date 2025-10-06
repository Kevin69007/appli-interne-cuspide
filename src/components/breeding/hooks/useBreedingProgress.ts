
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useBreedingProgress = (breedingPair: any, onUpdate: () => void) => {
  const [parent1, setParent1] = useState<any>(null);
  const [parent2, setParent2] = useState<any>(null);
  const [litterBabies, setLitterBabies] = useState<any[]>([]);

  // Enhanced time calculations using actual dates
  const now = new Date();
  const birthDate = new Date(breedingPair.birth_date);
  const weanDate = new Date(breedingPair.wean_date);
  
  const isReadyToBirth = now >= birthDate && !breedingPair.is_born;
  const isReadyToWean = now >= weanDate && breedingPair.is_born && !breedingPair.is_weaned;
  const isCompleted = breedingPair.is_completed;
  
  // Calculate time remaining display
  const getTimeRemaining = () => {
    if (isCompleted) {
      return "Breeding completed";
    }
    
    if (!breedingPair.is_born) {
      const timeUntilBirth = Math.max(0, Math.ceil((birthDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      if (timeUntilBirth === 0) {
        return "Ready to give birth!";
      }
      return `${timeUntilBirth} days until birth`;
    }
    
    if (!breedingPair.is_weaned && now < weanDate) {
      const timeUntilWean = Math.max(0, Math.ceil((weanDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      if (timeUntilWean === 0) {
        return "Ready to wean!";
      }
      return `${timeUntilWean} days until weaning`;
    }
    
    if (breedingPair.is_born && (breedingPair.is_weaned || now >= weanDate) && litterBabies.length > 0) {
      return "Ready to collect babies!";
    }
    
    return "Processing...";
  };

  const timeRemaining = getTimeRemaining();

  const fetchParents = async () => {
    try {
      const { data: parent1Data } = await supabase
        .from("user_pets")
        .select("*, pets(*)")
        .eq("id", breedingPair.parent1_id)
        .single();

      const { data: parent2Data } = await supabase
        .from("user_pets")
        .select("*, pets(*)")
        .eq("id", breedingPair.parent2_id)
        .single();

      setParent1(parent1Data);
      setParent2(parent2Data);
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const fetchLitterBabies = async () => {
    try {
      const { data: babies, error } = await supabase
        .from("litter_babies")
        .select("*")
        .eq("breeding_pair_id", breedingPair.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching litter babies:", error);
        return;
      }

      console.log("🍼 Fetched litter babies:", babies?.length || 0);
      setLitterBabies(babies || []);
    } catch (error) {
      console.error("Error fetching litter babies:", error);
    }
  };

  useEffect(() => {
    if (breedingPair) {
      fetchParents();
      fetchLitterBabies();
    }
  }, [breedingPair]);

  // Listen for litter collection events to refresh data
  useEffect(() => {
    const handleLitterCollected = () => {
      console.log("🔄 Litter collected event received, refreshing data");
      fetchLitterBabies();
      onUpdate();
    };

    window.addEventListener('litter-collected', handleLitterCollected);
    return () => window.removeEventListener('litter-collected', handleLitterCollected);
  }, [onUpdate]);

  return {
    parent1,
    parent2,
    timeRemaining,
    isReadyToBirth,
    isReadyToWean,
    isCompleted,
    litterBabies,
    fetchLitterBabies
  };
};
