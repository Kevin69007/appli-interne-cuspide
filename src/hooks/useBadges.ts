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
  // Exécuter toutes les requêtes en parallèle pour éviter les timeouts
  const [
    tasksResult,
    boomerangTasksResult,
    employeeTasksResult,
    projectsCreatedResult,
    projectsCompletedResult,
    ideasSubmittedResult,
    ideasValidatedResult,
    moodDataResult,
    positiveMoodsResult,
    gameSessionsResult,
    gameStatsResult,
    objectivesValidatedResult,
    cagnotteDataResult,
    topThreeDataResult
  ] = await Promise.all([
    // Tâches terminées
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", employeeId).eq("statut", "terminee"),
    // Boomerangs
    supabase.from("tasks").select("boomerang_history").eq("boomerang_original_owner", employeeId).not("boomerang_history", "is", null),
    // Tâches de l'employé pour les projets
    supabase.from("tasks").select("id").eq("assigned_to", employeeId),
    // Projets créés
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("created_by", employeeId),
    // Projets terminés
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("created_by", employeeId).eq("progression", 100),
    // Idées soumises
    supabase.from("ideas").select("*", { count: "exact", head: true }).eq("employee_id", employeeId),
    // Idées validées
    supabase.from("ideas").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).in("statut", ["implementee", "approuvee"]),
    // Humeur
    supabase.from("daily_mood").select("date").eq("employee_id", employeeId).order("date", { ascending: false }).limit(30),
    // Humeurs positives
    supabase.from("daily_mood").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).in("mood_emoji", ["😊", "😄", "🔥"]),
    // Sessions de jeu
    supabase.from("game_participants").select("*", { count: "exact", head: true }).eq("employee_id", employeeId),
    // Stats de jeu
    supabase.from("game_player_stats").select("times_investigator_won, times_target_won").eq("employee_id", employeeId).maybeSingle(),
    // Objectifs validés
    supabase.from("agenda_entries").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("categorie", "indicateurs").eq("statut_validation", "valide"),
    // Points cagnotte
    supabase.from("annual_cagnotte").select("total_points").eq("employee_id", employeeId).maybeSingle(),
    // Top 3
    supabase.from("best_of_month").select("*").eq("employee_id", employeeId)
  ]);

  // Calculer les boomerangs
  const boomerangsSent = boomerangTasksResult.data?.reduce((count, task) => {
    try {
      const history = task.boomerang_history as any[];
      return count + (history?.length || 0);
    } catch {
      return count;
    }
  }, 0) || 0;

  // Calculer les projets participés
  const taskIds = employeeTasksResult.data?.map(t => t.id) || [];
  let projectsParticipated = 0;
  if (taskIds.length > 0) {
    const { data: projectTasks } = await supabase
      .from("project_tasks")
      .select("project_id")
      .in("task_id", taskIds);
    projectsParticipated = new Set(projectTasks?.map(pt => pt.project_id)).size;
  }

  // Calculer la série d'humeur
  const moodStreak = calculateStreak(moodDataResult.data?.map(m => m.date) || []);

  // Tâches à temps - estimation 80%
  const completedTasks = tasksResult.count || 0;
  const onTimeCount = Math.floor(completedTasks * 0.8);

  return {
    completed_tasks: completedTasks,
    on_time_tasks: onTimeCount,
    boomerangs_sent: boomerangsSent,
    projects_participated: projectsParticipated,
    projects_created: projectsCreatedResult.count || 0,
    projects_completed: projectsCompletedResult.count || 0,
    ideas_submitted: ideasSubmittedResult.count || 0,
    ideas_validated: ideasValidatedResult.count || 0,
    mood_streak: moodStreak,
    positive_moods: positiveMoodsResult.count || 0,
    game_sessions: gameSessionsResult.count || 0,
    investigator_wins: gameStatsResult.data?.times_investigator_won || 0,
    target_survivals: gameStatsResult.data?.times_target_won || 0,
    objectives_validated: objectivesValidatedResult.count || 0,
    cagnotte_points: cagnotteDataResult.data?.total_points || 0,
    top_three: topThreeDataResult.data?.length || 0,
    quizzes_completed: 0,
    quiz_average: 0
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