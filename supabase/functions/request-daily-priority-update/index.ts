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

    console.log('Starting daily priority task update request...');

    const today = new Date().toISOString().split('T')[0];

    // Get priority tasks that are active
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        titre,
        assigned_employee:employees!tasks_assigned_to_fkey(id, nom, prenom, user_id),
        commentaires,
        project_tasks(project:projects!project_tasks_project_id_fkey(id, titre))
      `)
      .eq('is_priority', true)
      .in('statut', ['a_venir', 'en_cours']);

    if (tasksError) throw tasksError;

    console.log(`Found ${tasks?.length || 0} priority tasks`);

    let notificationsSent = 0;

    for (const task of tasks || []) {
      const assignedEmployee = Array.isArray(task.assigned_employee) && task.assigned_employee.length > 0 
        ? task.assigned_employee[0] 
        : task.assigned_employee;
      
      if (!assignedEmployee || Array.isArray(assignedEmployee)) continue;

      // Check if employee commented today
      const comments = task.commentaires || [];
      const hasCommentToday = comments.some((comment: any) => {
        const commentDate = new Date(comment.date).toISOString().split('T')[0];
        return commentDate === today;
      });

      if (hasCommentToday) {
        console.log(`Employee ${assignedEmployee.id} already commented on task ${task.id} today`);
        continue;
      }

      const projectData = task.project_tasks?.[0]?.project;
      const projectInfo = Array.isArray(projectData) && projectData.length > 0 
        ? projectData[0] 
        : projectData;
      
      const projectTitle = projectInfo && !Array.isArray(projectInfo) 
        ? ` (Projet: ${projectInfo.titre})` 
        : '';

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          employee_id: assignedEmployee.id,
          type: 'priority_task_daily_update',
          titre: '🔥 Point d\'avancement requis',
          message: `Merci d'ajouter un commentaire sur l'avancement de la tâche prioritaire : "${task.titre}"${projectTitle}`,
          url: projectInfo && !Array.isArray(projectInfo) && projectInfo.id
            ? `/projets/${projectInfo.id}` 
            : '/taches',
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      } else {
        notificationsSent++;
      }
    }

    console.log(`Sent ${notificationsSent} daily update requests`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tasksChecked: tasks?.length || 0,
        notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in request-daily-priority-update:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});