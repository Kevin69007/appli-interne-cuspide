import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Skipping weekend day');
      return new Response(
        JSON.stringify({ message: 'Weekend - no tasks created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all remote employees
    const { data: remoteEmployees, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('id, nom, prenom')
      .eq('is_remote', true);

    if (employeesError) {
      throw employeesError;
    }

    if (!remoteEmployees || remoteEmployees.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No remote employees found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const todayStr = today.toISOString().split('T')[0];
    const deadline = new Date(today);
    deadline.setHours(18, 0, 0, 0);

    const tasks = remoteEmployees.map(emp => ({
      titre: `⏰ Déclarer mes heures - ${todayStr}`,
      description: 'N\'oubliez pas de déclarer vos heures et votre taux d\'activité pour aujourd\'hui dans l\'onglet Planning → Déclaration d\'heures',
      priorite: 'haute',
      statut: 'a_venir',
      date_echeance: deadline.toISOString(),
      assigne_a: [emp.id],
      tags: ['distanciel', 'declaration-heures'],
      metadata: {
        type: 'auto_declaration',
        date_concernee: todayStr,
        redirect_url: '/agenda?tab=declaration'
      }
    }));

    const { data: createdTasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .insert(tasks)
      .select();

    if (tasksError) {
      throw tasksError;
    }

    console.log(`Created ${createdTasks?.length || 0} time declaration tasks`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdTasks?.length || 0} tasks for remote employees`,
        tasksCreated: createdTasks?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating daily tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});