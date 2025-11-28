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
}

export interface BadgeStats {
  completed_tasks: number;
  on_time_tasks: number;
  boomerangs_sent: number;
  projects_participated: number;
  projects_created: number;
  projects_completed: number;
  ideas_submitted: number;
  ideas_validated: number;
  mood_streak: number;
  positive_moods: number;
  game_sessions: number;
  investigator_wins: number;
  target_survivals: number;
  objectives_validated: number;
  cagnotte_points: number;
  top_three: number;
  quizzes_completed: number;
  quiz_average: number;
}

export function useBadges(employeeId: string | null) {
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const fetchBadgesAndStats = async () => {
      try {
        // Récupérer les badges débloqués
        const { data: unlockedBadges, error: badgesError } = await supabase
          .from("employee_badges")
          .select("*")
          .eq("employee_id", employeeId);

        if (badgesError) throw badgesError;

        // Calculer les statistiques
        const calculatedStats = await calculateStats(employeeId);
        setStats(calculatedStats);

        // Créer la liste complète des badges avec progression
        const badgeProgresses: BadgeProgress[] = BADGE_DEFINITIONS.map(badge => {
          const unlocked = unlockedBadges?.find(ub => ub.badge_id === badge.id);
          const currentProgress = getProgressForBadge(badge, calculatedStats);

          return {
            badgeId: badge.id,
            badge,
            unlocked: !!unlocked,
            progress: currentProgress,
            unlockedAt: unlocked?.unlocked_at ? new Date(unlocked.unlocked_at) : undefined
          };
        });

        setBadges(badgeProgresses);

        // Vérifier et débloquer automatiquement les nouveaux badges
        await checkAndUnlockBadges(employeeId, badgeProgresses, unlockedBadges || []);
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
  }, [employeeId, toast]);

  return { badges, stats, loading, totalUnlocked: badges.filter(b => b.unlocked).length };
}

async function calculateStats(employeeId: string): Promise<BadgeStats> {
  // Tâches terminées
  const { count: completedTasks } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", employeeId)
    .eq("statut", "terminee");

  // Tâches à temps - pour l'instant on compte toutes les tâches terminées
  // TODO: Améliorer avec un système de tracking de date de complétion
  const onTimeCount = Math.floor((completedTasks || 0) * 0.8); // Estimation 80%

  // Boomerangs envoyés - comptés via boomerang_history
  const { data: boomerangTasks } = await supabase
    .from("tasks")
    .select("boomerang_history")
    .eq("boomerang_original_owner", employeeId)
    .not("boomerang_history", "is", null);

  const boomerangsSent = boomerangTasks?.reduce((count, task) => {
    try {
      const history = task.boomerang_history as any[];
      return count + (history?.length || 0);
    } catch {
      return count;
    }
  }, 0) || 0;

  // Projets participés - via les tâches assignées à l'employé dans des projets
  const { data: employeeTasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("assigned_to", employeeId);

  const taskIds = employeeTasks?.map(t => t.id) || [];
  
  const { data: projectTasks } = await supabase
    .from("project_tasks")
    .select("project_id")
    .in("task_id", taskIds);

  const projectsParticipated = new Set(projectTasks?.map(pt => pt.project_id)).size;

  // Projets créés
  const { count: projectsCreated } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("created_by", employeeId);

  // Projets terminés
  const { count: projectsCompleted } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("created_by", employeeId)
    .eq("progression", 100);

  // Idées soumises
  const { count: ideasSubmitted } = await supabase
    .from("ideas")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId);

  // Idées validées (implementee ou approuvee)
  const { count: ideasValidated } = await supabase
    .from("ideas")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .in("statut", ["implementee", "approuvee"]);

  // Humeur - série actuelle
  const { data: moodData } = await supabase
    .from("daily_mood")
    .select("date")
    .eq("employee_id", employeeId)
    .order("date", { ascending: false })
    .limit(30);

  const moodStreak = calculateStreak(moodData?.map(m => m.date) || []);

  // Humeurs positives
  const { count: positiveMoods } = await supabase
    .from("daily_mood")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .in("mood_emoji", ["😊", "😄", "🔥"]);

  // Sessions de jeu
  const { count: gameSessions } = await supabase
    .from("game_participants")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId);

  // Statistiques de jeu
  const { data: gameStats } = await supabase
    .from("game_player_stats")
    .select("times_investigator_won, times_target_won")
    .eq("employee_id", employeeId)
    .single();

  // Objectifs validés
  const { count: objectivesValidated } = await supabase
    .from("agenda_entries")
    .select("*", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("categorie", "indicateurs")
    .eq("statut_validation", "valide");

  // Points cagnotte
  const { data: cagnotteData } = await supabase
    .from("annual_cagnotte")
    .select("total_points")
    .eq("employee_id", employeeId)
    .single();

  // Top 3 du mois
  const { data: topThreeData } = await supabase
    .from("best_of_month")
    .select("*")
    .eq("employee_id", employeeId);

  // Quiz (à implémenter selon votre structure)
  const quizzesCompleted = 0; // TODO
  const quizAverage = 0; // TODO

  return {
    completed_tasks: completedTasks || 0,
    on_time_tasks: onTimeCount,
    boomerangs_sent: boomerangsSent || 0,
    projects_participated: projectsParticipated || 0,
    projects_created: projectsCreated || 0,
    projects_completed: projectsCompleted || 0,
    ideas_submitted: ideasSubmitted || 0,
    ideas_validated: ideasValidated || 0,
    mood_streak: moodStreak,
    positive_moods: positiveMoods || 0,
    game_sessions: gameSessions || 0,
    investigator_wins: gameStats?.times_investigator_won || 0,
    target_survivals: gameStats?.times_target_won || 0,
    objectives_validated: objectivesValidated || 0,
    cagnotte_points: cagnotteData?.total_points || 0,
    top_three: topThreeData?.length || 0,
    quizzes_completed: quizzesCompleted,
    quiz_average: quizAverage
  };
}

function getProgressForBadge(badge: BadgeDefinition, stats: BadgeStats): number {
  const currentValue = stats[badge.condition as keyof BadgeStats] as number || 0;
  return Math.min(100, Math.round((currentValue / badge.requiredCount) * 100));
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  let streak = 1;
  const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function checkAndUnlockBadges(
  employeeId: string,
  badgeProgresses: BadgeProgress[],
  unlockedBadges: any[]
) {
  const newlyUnlocked = badgeProgresses.filter(
    bp => bp.progress >= 100 && !bp.unlocked
  );

  for (const badge of newlyUnlocked) {
    try {
      await supabase.from("employee_badges").insert({
        employee_id: employeeId,
        badge_id: badge.badgeId,
        progress: 100
      });
    } catch (error) {
      console.error("Error unlocking badge:", error);
    }
  }
}