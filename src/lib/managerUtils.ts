import { supabase } from "@/integrations/supabase/client";

export interface ManagedEmployee {
  id: string;
  nom: string;
  prenom: string;
  poste: string | null;
  equipe: string | null;
  email: string | null;
}

export interface OverdueTask {
  id: string;
  titre: string;
  description: string | null;
  date_echeance: string;
  priorite: string | null;
  statut: string;
  assigned_to: string;
  employee_nom: string;
  employee_prenom: string;
  employee_equipe: string | null;
  jours_retard: number;
}

export interface ManagerDashboardStats {
  total_employees: number;
  total_overdue_tasks: number;
  pending_validations: number;
  average_score: number;
}

/**
 * Récupère tous les employés gérés par un manager
 */
export const getManagedEmployees = async (
  managerEmployeeId: string
): Promise<ManagedEmployee[]> => {
  const { data, error } = await supabase
    .from("employees")
    .select("id, nom, prenom, poste, equipe, email")
    .eq("manager_id", managerEmployeeId)
    .order("nom");

  if (error) {
    console.error("Erreur lors de la récupération des employés gérés:", error);
    return [];
  }

  return data || [];
};

/**
 * Récupère les tâches en retard des employés gérés
 */
export const getOverdueTasksForManagedEmployees = async (
  managerEmployeeId: string
): Promise<OverdueTask[]> => {
  // D'abord récupérer les IDs des employés gérés
  const { data: managedEmployees, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("manager_id", managerEmployeeId);

  if (empError || !managedEmployees || managedEmployees.length === 0) {
    return [];
  }

  const employeeIds = managedEmployees.map(e => e.id);

  // Puis récupérer leurs tâches en retard
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      titre,
      description,
      date_echeance,
      priorite,
      statut,
      assigned_to,
      employees!tasks_assigned_to_fkey (
        nom,
        prenom,
        equipe
      )
    `)
    .in("assigned_to", employeeIds)
    .in("statut", ["en_cours", "a_faire"])
    .lt("date_echeance", new Date().toISOString())
    .order("date_echeance");

  if (error) {
    console.error("Erreur lors de la récupération des tâches en retard:", error);
    return [];
  }

  const tasks: OverdueTask[] = (data || []).map((task: any) => {
    const dateEcheance = new Date(task.date_echeance);
    const now = new Date();
    const joursRetard = Math.floor(
      (now.getTime() - dateEcheance.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: task.id,
      titre: task.titre,
      description: task.description,
      date_echeance: task.date_echeance,
      priorite: task.priorite,
      statut: task.statut,
      assigned_to: task.assigned_to,
      employee_nom: task.employees?.nom || "",
      employee_prenom: task.employees?.prenom || "",
      employee_equipe: task.employees?.equipe || null,
      jours_retard: joursRetard,
    };
  });

  return tasks;
};

/**
 * Récupère les statistiques pour le dashboard manager
 */
export const getManagerDashboardStats = async (
  managerEmployeeId: string
): Promise<ManagerDashboardStats> => {
  // Nombre d'employés
  const { count: employeeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("manager_id", managerEmployeeId);

  // Récupérer les IDs des employés gérés
  const { data: managedEmployees } = await supabase
    .from("employees")
    .select("id")
    .eq("manager_id", managerEmployeeId);

  const employeeIds = (managedEmployees || []).map(e => e.id);

  // Tâches en retard
  const { count: overdueTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .in("assigned_to", employeeIds)
    .in("statut", ["en_cours", "a_faire"])
    .lt("date_echeance", new Date().toISOString());

  // Validations en attente (indicateurs)
  const { count: pendingValidationsCount } = await supabase
    .from("agenda_entries")
    .select("*", { count: "exact", head: true })
    .in("employee_id", employeeIds)
    .eq("statut_validation", "en_attente");

  // Score moyen du mois en cours
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: scoresData } = await supabase
    .from("monthly_scores")
    .select("score_global")
    .in("employee_id", employeeIds)
    .eq("mois", currentMonth)
    .eq("annee", currentYear);

  const averageScore =
    scoresData && scoresData.length > 0
      ? scoresData.reduce((sum, s) => sum + (s.score_global || 0), 0) / scoresData.length
      : 0;

  return {
    total_employees: employeeCount || 0,
    total_overdue_tasks: overdueTasksCount || 0,
    pending_validations: pendingValidationsCount || 0,
    average_score: Math.round(averageScore * 10) / 10,
  };
};

/**
 * Récupère l'ID de l'employé associé à l'utilisateur connecté
 */
export const getCurrentEmployeeId = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
};
