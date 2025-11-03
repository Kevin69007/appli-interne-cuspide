import { supabase } from "@/integrations/supabase/client";

export const calculateMonthlyScore = async (
  employeeId: string,
  month: number,
  year: number
) => {
  try {
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

    // Récupérer toutes les entrées du mois
    const { data: entries, error: entriesError } = await supabase
      .from('agenda_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .eq('statut_validation', 'valide');

    if (entriesError) throw entriesError;

    let scoreObjectifs = 0;
    let bonusPoints = 0;
    let malusPoints = 0;

    entries?.forEach(entry => {
      if (entry.categorie === 'objectifs' && entry.points_objectif) {
        scoreObjectifs += entry.points_objectif;
      } else if (entry.points) {
        if (entry.points > 0) {
          bonusPoints += entry.points;
        } else {
          malusPoints += entry.points;
        }
      }
    });

    const scoreGlobal = scoreObjectifs + bonusPoints + malusPoints;

    // Calculer la projection
    const totalDays = new Date(year, month, 0).getDate();
    const currentDay = new Date().getDate();
    const isCurrentMonth = new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
    const monthPercentage = isCurrentMonth ? (currentDay / totalDays) * 100 : 100;
    const achievementPercentage = scoreGlobal;

    let projectionStatus = null;
    if (isCurrentMonth) {
      if (achievementPercentage >= monthPercentage + 10) {
        projectionStatus = 'en_avance';
      } else if (achievementPercentage >= monthPercentage - 10) {
        projectionStatus = 'dans_les_temps';
      } else {
        projectionStatus = 'en_retard';
      }
    }

    // Mettre à jour ou créer le score mensuel
    const { data: existingScore } = await supabase
      .from('monthly_scores')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('mois', month)
      .eq('annee', year)
      .single();

    const scoreData = {
      employee_id: employeeId,
      mois: month,
      annee: year,
      score_objectifs: scoreObjectifs,
      bonus_points: bonusPoints,
      malus_points: malusPoints,
      score_global: scoreGlobal,
      projection_status: projectionStatus,
      projection_percentage: achievementPercentage,
      updated_at: new Date().toISOString()
    };

    if (existingScore) {
      await supabase
        .from('monthly_scores')
        .update(scoreData)
        .eq('id', existingScore.id);
    } else {
      await supabase
        .from('monthly_scores')
        .insert(scoreData);
    }

    return scoreData;
  } catch (error) {
    console.error('Error calculating monthly score:', error);
    throw error;
  }
};

export const updateAnnualCagnotte = async (
  employeeId: string,
  month: number,
  year: number
) => {
  try {
    // Récupérer le score du mois
    const { data: monthlyScore } = await supabase
      .from('monthly_scores')
      .select('score_global')
      .eq('employee_id', employeeId)
      .eq('mois', month)
      .eq('annee', year)
      .single();

    if (!monthlyScore) return;

    const pointsExcedent = monthlyScore.score_global - 100;

    // Récupérer ou créer la cagnotte annuelle
    const { data: cagnotte } = await supabase
      .from('annual_cagnotte')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('annee', year)
      .single();

    if (cagnotte) {
      await supabase
        .from('annual_cagnotte')
        .update({
          total_points: cagnotte.total_points + pointsExcedent,
          updated_at: new Date().toISOString()
        })
        .eq('id', cagnotte.id);
    } else {
      await supabase
        .from('annual_cagnotte')
        .insert({
          employee_id: employeeId,
          annee: year,
          total_points: Math.max(0, pointsExcedent)
        });
    }
  } catch (error) {
    console.error('Error updating annual cagnotte:', error);
    throw error;
  }
};
