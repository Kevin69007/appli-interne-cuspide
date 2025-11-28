import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "@/lib/badges";
import { useToast } from "@/hooks/use-toast";

export interface BadgeProgress {
  badgeId: string;
  badge: BadgeDefinition;
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
  annualCount: number;
  currentMonthUnlocked: boolean;
}

export interface BadgeStats {
  completed_tasks: number;
  boomerangs_sent: number;
  projects_participated: number;
  projects_created: number;
  ideas_submitted: number;
  ideas_validated: number;
  mood_days: number;
  positive_moods: number;
  game_sessions: number;
  objectives_validated: number;
}

export function useBadges(employeeId: string | null, month?: number, year?: number) {
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const fetchBadgesAndStats = async () => {
      try {
        // Utiliser la fonction SQL côté serveur pour les performances
        const { data: statsData, error: statsError } = await supabase
          .rpc("get_employee_badge_stats", {
            p_employee_id: employeeId,
            p_month: currentMonth,
            p_year: currentYear
          });

        if (statsError) throw statsError;

        const calculatedStats = statsData as unknown as BadgeStats;
        setStats(calculatedStats);

        // Récupérer les badges débloqués pour ce mois
        const { data: currentMonthBadges, error: currentBadgesError } = await supabase
          .from("employee_badges")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("mois", currentMonth)
          .eq("annee", currentYear);

        if (currentBadgesError) throw currentBadgesError;

        // Récupérer le compteur annuel de chaque badge
        const { data: annualCounts, error: annualError } = await supabase
          .from("employee_badge_annual_counts")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("annee", currentYear);

        if (annualError) throw annualError;

        // Créer la liste complète des badges avec progression
        const badgeProgresses: BadgeProgress[] = BADGE_DEFINITIONS.map(badge => {
          const currentMonthUnlocked = currentMonthBadges?.find(ub => ub.badge_id === badge.id);
          const annualCount = annualCounts?.find(ac => ac.badge_id === badge.id)?.count || 0;
          const currentProgress = getProgressForBadge(badge, calculatedStats);

          return {
            badgeId: badge.id,
            badge,
            unlocked: !!currentMonthUnlocked,
            currentMonthUnlocked: !!currentMonthUnlocked,
            progress: currentProgress,
            unlockedAt: currentMonthUnlocked?.unlocked_at ? new Date(currentMonthUnlocked.unlocked_at) : undefined,
            annualCount: annualCount
          };
        });

        setBadges(badgeProgresses);

        // Vérifier et débloquer automatiquement les nouveaux badges
        await checkAndUnlockBadges(employeeId, badgeProgresses, currentMonthBadges || [], currentMonth, currentYear);
      } catch (error) {
        console.error("Error fetching badges:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les badges",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBadgesAndStats();
  }, [employeeId, currentMonth, currentYear, toast]);

  return { 
    badges, 
    stats, 
    loading, 
    totalUnlocked: badges.filter(b => b.annualCount > 0).length 
  };
}

// Fonction de calcul des statistiques supprimée - maintenant calculée côté serveur via get_employee_badge_stats

function getProgressForBadge(badge: BadgeDefinition, stats: BadgeStats): number {
  const currentValue = stats[badge.condition as keyof BadgeStats] as number || 0;
  return Math.min(100, Math.round((currentValue / badge.requiredCount) * 100));
}

async function checkAndUnlockBadges(
  employeeId: string,
  badgeProgresses: BadgeProgress[],
  currentMonthBadges: any[],
  month: number,
  year: number
) {
  const newlyUnlocked = badgeProgresses.filter(
    bp => bp.progress >= 100 && !bp.currentMonthUnlocked
  );

  for (const badge of newlyUnlocked) {
    try {
      // Récupérer le compteur annuel actuel
      const { data: annualData } = await supabase
        .from("employee_badge_annual_counts")
        .select("count")
        .eq("employee_id", employeeId)
        .eq("badge_id", badge.badgeId)
        .eq("annee", year)
        .single();

      const currentAnnualCount = annualData?.count || 0;

      // Insérer le badge pour ce mois
      await supabase.from("employee_badges").insert({
        employee_id: employeeId,
        badge_id: badge.badgeId,
        mois: month,
        annee: year,
        progress: 100,
        annual_count: currentAnnualCount + 1
      });
    } catch (error) {
      console.error("Error unlocking badge:", error);
    }
  }
}