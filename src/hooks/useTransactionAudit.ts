
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface TransactionSummary {
  totalPawDollars: number;
  totalPawPoints: number;
  totalXP: number;
  transactionCounts: {
    pawDollar: number;
    pawPoint: number;
    xp: number;
  };
  missingTransactions: string[];
}

export const useTransactionAudit = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const auditTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get current profile totals
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_dollars, paw_points, xp")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      // Get all transaction records
      const [pawDollarTxns, pawPointTxns, xpTxns] = await Promise.all([
        supabase
          .from("paw_dollar_transactions")
          .select("amount")
          .eq("user_id", user.id),
        supabase
          .from("pet_transactions")
          .select("paw_points")
          .eq("user_id", user.id)
          .not("paw_points", "is", null),
        supabase
          .from("xp_transactions")
          .select("xp_amount")
          .eq("user_id", user.id)
      ]);

      // Calculate transaction totals
      const pawDollarTotal = pawDollarTxns.data?.reduce((sum, txn) => sum + (txn.amount || 0), 0) || 0;
      const pawPointTotal = pawPointTxns.data?.reduce((sum, txn) => sum + (txn.paw_points || 0), 0) || 0;
      const xpTotal = xpTxns.data?.reduce((sum, txn) => sum + (txn.xp_amount || 0), 0) || 0;

      // Check for discrepancies
      const missingTransactions: string[] = [];
      
      if (Math.abs((profile.paw_dollars || 0) - pawDollarTotal) > 1) {
        missingTransactions.push(`Paw Dollars: Profile shows ${profile.paw_dollars}, transactions total ${pawDollarTotal}`);
      }
      
      if (Math.abs((profile.paw_points || 0) - pawPointTotal) > 1) {
        missingTransactions.push(`Paw Points: Profile shows ${profile.paw_points}, transactions total ${pawPointTotal}`);
      }
      
      if (Math.abs((profile.xp || 0) - xpTotal) > 1) {
        missingTransactions.push(`XP: Profile shows ${profile.xp}, transactions total ${xpTotal}`);
      }

      setSummary({
        totalPawDollars: pawDollarTotal,
        totalPawPoints: pawPointTotal,
        totalXP: xpTotal,
        transactionCounts: {
          pawDollar: pawDollarTxns.data?.length || 0,
          pawPoint: pawPointTxns.data?.length || 0,
          xp: xpTxns.data?.length || 0
        },
        missingTransactions
      });

      console.log("📊 Transaction Audit Results:", {
        profile: { 
          pawDollars: profile.paw_dollars, 
          pawPoints: profile.paw_points, 
          xp: profile.xp 
        },
        transactions: { 
          pawDollars: pawDollarTotal, 
          pawPoints: pawPointTotal, 
          xp: xpTotal 
        },
        missingTransactions
      });

    } catch (error) {
      console.error("Error auditing transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      auditTransactions();
    }
  }, [user]);

  return {
    summary,
    loading,
    auditTransactions
  };
};
