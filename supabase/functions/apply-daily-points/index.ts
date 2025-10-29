import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting daily points application...');
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const isSunday = todayDate.getDay() === 0;

    // Récupérer la configuration des points
    const { data: bonusConfig } = await supabase
      .from('bonus_malus_config')
      .select('*')
      .eq('is_active', true);

    if (!bonusConfig) {
      throw new Error('No bonus config found');
    }

    const pointsConfig = bonusConfig.reduce((acc, config) => {
      const key = config.gravite ? `${config.event_type}_${config.gravite}` : config.event_type;
      acc[key] = config.points;
      return acc;
    }, {} as Record<string, number>);

    console.log('📋 Points configuration loaded:', pointsConfig);

    // 1. GESTION DES TÂCHES
    const { data: tasks } = await supabase
      .from('tasks')
      .select(`
        id,
        titre,
        statut,
        maintenance_type,
        responsable_id,
        date_echeance
      `)
      .eq('date_echeance', today);

    console.log(`📝 Found ${tasks?.length || 0} tasks for today`);

    let taskPointsApplied = 0;

    for (const task of tasks || []) {
      let points = 0;
      let eventType = '';
      let detail = '';

      if (task.statut === 'terminee') {
        // Tâche complétée à temps
        points = pointsConfig['tache_a_temps'] || 3;
        eventType = 'tache_a_temps';
        detail = `Tâche "${task.titre}" complétée à temps`;
      } else {
        // Tâche en retard
        if (task.maintenance_type) {
          // Tâche d'entretien
          points = pointsConfig['tache_entretien_retard'] || -15;
          eventType = 'tache_entretien_retard';
          detail = `Tâche d'entretien "${task.titre}" non complétée`;
        } else {
          // Tâche standard
          points = pointsConfig['tache_standard_retard'] || -5;
          eventType = 'tache_standard_retard';
          detail = `Tâche "${task.titre}" non complétée`;
        }
      }

      // Insérer dans agenda_entries
      const { error: insertError } = await supabase
        .from('agenda_entries')
        .insert({
          employee_id: task.responsable_id,
          date: today,
          categorie: 'systeme',
          type: eventType,
          detail: detail,
          points: points,
          auteur_id: null,
          statut_validation: 'valide'
        });

      if (insertError) {
        console.error(`❌ Error inserting task points for ${task.titre}:`, insertError);
      } else {
        taskPointsApplied++;
        console.log(`✅ Applied ${points} points for task: ${task.titre}`);
      }
    }

    // 2. PARTICIPATION JEU HEBDOMADAIRE (dimanche uniquement)
    let gamePointsApplied = 0;

    if (isSunday) {
      console.log('🎮 Sunday detected - checking game participation');
      
      // Récupérer la session de jeu active
      const { data: activeSession } = await supabase
        .from('weekly_game_sessions')
        .select('id')
        .in('status', ['in_progress', 'finished'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (activeSession) {
        const { data: participants } = await supabase
          .from('game_participants')
          .select('employee_id')
          .eq('session_id', activeSession.id);

        const gamePoints = pointsConfig['participation_jeu_hebdo'] || 5;

        for (const participant of participants || []) {
          const { error: insertError } = await supabase
            .from('agenda_entries')
            .insert({
              employee_id: participant.employee_id,
              date: today,
              categorie: 'systeme',
              type: 'participation_jeu_hebdo',
              detail: 'Participation au jeu hebdomadaire',
              points: gamePoints,
              auteur_id: null,
              statut_validation: 'valide'
            });

          if (!insertError) {
            gamePointsApplied++;
            console.log(`✅ Applied ${gamePoints} points for game participation`);
          }
        }
      }
    }

    console.log(`✨ Daily points application completed:
      - Tasks processed: ${taskPointsApplied}
      - Game points applied: ${gamePointsApplied}
    `);

    return new Response(
      JSON.stringify({
        success: true,
        taskPointsApplied,
        gamePointsApplied,
        date: today
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in apply-daily-points:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
