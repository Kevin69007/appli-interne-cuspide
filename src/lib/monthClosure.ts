import { supabase } from "@/integrations/supabase/client";
import { calculateMonthlyScore } from "./scoreCalculations";

export const closeMonth = async (
  month: number, 
  year: number, 
  userId: string
) => {
  try {
    // 1. Récupérer l'employé du manager
    const { data: managerEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!managerEmployee) {
      throw new Error("Employé non trouvé");
    }

    // 2. Récupérer les équipes gérées par ce manager
    const { data: teamAssignments } = await supabase
      .from('team_managers')
      .select('equipe')
      .eq('manager_employee_id', managerEmployee.id);

    const managerTeams = teamAssignments?.map(t => t.equipe) || [];

    if (managerTeams.length === 0) {
      throw new Error("Aucune équipe assignée");
    }

    // 3. Vérifier que tous les indicateurs ont été contrôlés
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: uncheckedIndicators } = await supabase
      .from('agenda_entries')
      .select(`
        id,
        employee:employees!inner(equipe)
      `)
      .eq('categorie', 'indicateurs')
      .eq('controle_effectue', false)
      .not('valeur_declaree', 'is', null)
      .gte('date', firstDay)
      .lte('date', lastDay);

    // Filtrer par équipes du manager
    const teamUnchecked = uncheckedIndicators?.filter((ind: any) => 
      managerTeams.includes(ind.employee?.equipe)
    );

    if (teamUnchecked && teamUnchecked.length > 0) {
      throw new Error(
        `${teamUnchecked.length} indicateur(s) non contrôlé(s). Veuillez contrôler tous les indicateurs avant de clôturer.`
      );
    }

    // 4. Récupérer les employés des équipes
    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .in('equipe', managerTeams);

    if (!employees || employees.length === 0) {
      throw new Error("Aucun employé trouvé");
    }

    // 5. Recalculer tous les scores du mois
    for (const emp of employees) {
      await calculateMonthlyScore(emp.id, month, year);
    }

    // 6. Marquer le mois comme clôturé
    const { error: updateError } = await supabase
      .from('monthly_scores')
      .update({
        statut: 'cloture',
        cloture_par: userId,
        date_cloture: new Date().toISOString()
      })
      .eq('mois', month)
      .eq('annee', year)
      .in('employee_id', employees.map(e => e.id));

    if (updateError) {
      throw updateError;
    }

    return { success: true, employeesCount: employees.length };
  } catch (error) {
    console.error('Error closing month:', error);
    throw error;
  }
};

export const getMonthStatus = async (
  employeeId: string,
  month: number,
  year: number
) => {
  const { data } = await supabase
    .from('monthly_scores')
    .select('statut, date_cloture, cloture_par')
    .eq('employee_id', employeeId)
    .eq('mois', month)
    .eq('annee', year)
    .maybeSingle();

  return data || { statut: 'ouvert' };
};
