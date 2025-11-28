import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeBadgeSummary {
  employee_id: string;
  total_unique_badges: number;
  badges_this_year: number;
  recent_badges: Array<{
    badge_id: string;
    annual_count: number;
    last_unlocked: string;
  }>;
}

/**
 * Hook léger pour récupérer le résumé des badges d'un employé
 * Utilisé dans le Trombinoscope pour afficher les informations basiques sans charger tous les détails
 */
export function useEmployeeBadgeSummary(employeeId: string | null) {
  const [summary, setSummary] = useState<EmployeeBadgeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        const { data, error } = await supabase
          .from("employee_badge_summary")
          .select("*")
          .eq("employee_id", employeeId)
          .single();

        if (error) throw error;

        // Parser le JSON de recent_badges
        const parsedSummary = {
          ...data,
          recent_badges: (data.recent_badges as any[]) || []
        };

        setSummary(parsedSummary);
      } catch (error) {
        console.error("Error fetching badge summary:", error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [employeeId]);

  return { summary, loading };
}
