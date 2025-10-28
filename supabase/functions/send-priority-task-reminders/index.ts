import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting priority task reminders check...');

    // Get priority tasks without recent progress
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        titre,
        date_echeance,
        responsible:employees!tasks_responsible_id_fkey(id, nom, prenom, user_id),
        project_tasks(project:projects!project_tasks_project_id_fkey(id, titre))
      `)
      .eq('is_priority', true)
      .in('statut', ['a_venir', 'en_cours'])
      .or(`last_progress_comment_at.is.null,last_progress_comment_at.lt.${twoDaysAgo.toISOString()}`);

    if (tasksError) throw tasksError;

    console.log(`Found ${tasks?.length || 0} tasks needing reminders`);

    let notificationsSent = 0;

    for (const task of tasks || []) {
      if (!task.responsible) continue;

      // Get employee ID
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', task.responsible.user_id)
        .single();

      if (!employee) continue;

      const projectInfo = task.project_tasks?.[0]?.project;
      const projectTitle = projectInfo ? ` (Projet: ${projectInfo.titre})` : '';

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          employee_id: employee.id,
          type: 'priority_task_no_progress',
          titre: 'Tâche prioritaire sans avancement',
          message: `La tâche prioritaire "${task.titre}"${projectTitle} n'a pas eu de commentaire d'avancement depuis plus de 2 jours.`,
          url: task.project_tasks?.[0]?.project?.id 
            ? `/projets/${task.project_tasks[0].project.id}` 
            : '/taches',
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      } else {
        notificationsSent++;
      }
    }

    console.log(`Sent ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tasksChecked: tasks?.length || 0,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-priority-task-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
