
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { recordXPTransaction } from "@/utils/transactionUtils";

interface XPTransaction {
  id: string;
  user_id: string;
  xp_amount: number;
  activity_type: string;
  description: string;
  created_at: string;
}

export const useXPTracking = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const recordXPTransactionWrapper = async (xpAmount: number, activityType: string, description: string) => {
    if (!user) return;

    try {
      await recordXPTransaction(
        user.id,
        xpAmount,
        activityType,
        description
      );
    } catch (error) {
      console.error("Error in recordXPTransaction:", error);
    }
  };

  const getXPTransactions = async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("xp_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching XP transactions:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    recordXPTransaction: recordXPTransactionWrapper,
    getXPTransactions,
    loading
  };
};
