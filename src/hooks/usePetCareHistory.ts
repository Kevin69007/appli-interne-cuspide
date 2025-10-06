
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePetCareHistory = (petId: string) => {
  const { toast } = useToast();
  const [careHistory, setCareHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCareHistory = async () => {
    if (!petId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching care history for pet:", petId);

      // Fetch pet transactions for feeding and watering using pattern matching - limit to 15 most recent
      const { data: transactions, error: transactionError } = await supabase
        .from("pet_transactions")
        .select("*")
        .eq("pet_id", petId)
        .or("description.ilike.%Fed%,description.ilike.%Water%")
        .order("created_at", { ascending: false })
        .limit(15);

      if (transactionError) {
        throw transactionError;
      }

      console.log("🔍 Found transactions:", transactions);

      if (!transactions || transactions.length === 0) {
        setCareHistory([]);
        return;
      }

      // Extract unique user IDs from transactions
      const userIds = [...new Set(transactions.map(t => t.user_id))];
      console.log("🔍 User IDs found:", userIds);

      // Fetch profile data for these users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, profile_image_url")
        .in("id", userIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
        // Continue without profile data rather than failing completely
      }

      console.log("🔍 Found profiles:", profiles);

      // Create a map of user_id to profile for easy lookup
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Combine transaction data with profile data
      const combinedData = transactions.map(transaction => ({
        ...transaction,
        profiles: profileMap.get(transaction.user_id) || null
      }));

      console.log("🔍 Combined care history data:", combinedData);
      setCareHistory(combinedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load care history";
      console.error("Error fetching care history:", error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareHistory();
  }, [petId]);

  return {
    careHistory,
    loading,
    error,
    refetch: fetchCareHistory
  };
};
