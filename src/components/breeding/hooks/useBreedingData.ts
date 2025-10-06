
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAutomaticBirth } from "./useAutomaticBirth";
import { useAutomaticWeaning } from "./useAutomaticWeaning";

export const useBreedingData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [breedingPairs, setBreedingPairs] = useState<any[]>([]);
  const [userLicenseCount, setUserLicenseCount] = useState(0);

  // Use automatic birth and weaning hooks
  const { isProcessing: isAutoProcessingBirth } = useAutomaticBirth(breedingPairs);
  const { isProcessing: isAutoProcessingWeaning } = useAutomaticWeaning(breedingPairs);

  const fetchData = async () => {
    if (!user) return;

    try {
      setDataLoading(true);
      console.log("🔄 Fetching breeding data...");

      // Fetch breeding pairs
      const { data: pairsData, error: pairsError } = await supabase
        .from("breeding_pairs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pairsError) {
        console.error("Error fetching breeding pairs:", pairsError);
        return;
      }

      console.log("📊 Fetched breeding pairs:", pairsData?.length || 0);
      setBreedingPairs(pairsData || []);

      // Fetch user license count
      const { data: licensesData, error: licensesError } = await supabase
        .from("litter_licenses")
        .select("*")
        .eq("user_id", user.id)
        .eq("used", false);

      if (licensesError) {
        console.error("Error fetching licenses:", licensesError);
        return;
      }

      setUserLicenseCount(licensesData?.length || 0);
    } catch (error) {
      console.error("Error in fetchData:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  // Listen for breeding updates
  useEffect(() => {
    const handleBreedingUpdate = () => {
      console.log("🔄 Breeding update received, refreshing data");
      fetchData();
    };

    window.addEventListener('breeding-update', handleBreedingUpdate);
    return () => window.removeEventListener('breeding-update', handleBreedingUpdate);
  }, [user]);

  return {
    user,
    loading,
    breedingPairs,
    userLicenseCount,
    dataLoading: dataLoading || isAutoProcessingBirth || isAutoProcessingWeaning,
    fetchData
  };
};
