import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔔 Sending monthly closure reminders...");

    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // Récupérer tous les managers qui ont des équipes assignées
    const { data: teamManagers, error: tmError } = await supabase
      .from("team_managers")
      .select("manager_employee_id, equipe");

    if (tmError) {
      console.error("Error fetching team managers:", tmError);
      throw tmError;
    }

    // Grouper par manager
    const managerTeamsMap = new Map<string, string[]>();
    teamManagers?.forEach((tm) => {
      const teams = managerTeamsMap.get(tm.manager_employee_id) || [];
      teams.push(tm.equipe);
      managerTeamsMap.set(tm.manager_employee_id, teams);
    });

    // Récupérer les infos des managers
    const managerIds = Array.from(managerTeamsMap.keys());
    const { data: managers, error: empError } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .in("id", managerIds);

    if (empError) {
      console.error("Error fetching managers:", empError);
      throw empError;
    }

    // Créer les notifications pour chaque manager
    const notifications = managers?.map((manager) => ({
      employee_id: manager.id,
      type: "warning",
      titre: "⏰ Clôture mensuelle requise",
      message: `Veuillez clôturer les indicateurs de ${getMonthName(
        lastMonth
      )} ${lastYear} pour calculer les primes de vos équipes.`,
      url: "/indicateurs-primes/admin?tab=cloture",
    }));

    if (notifications && notifications.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Error creating notifications:", notifError);
        throw notifError;
      }

      // Enregistrer les rappels envoyés
      const reminders = managers?.map((manager) => ({
        manager_employee_id: manager.id,
        mois: lastMonth,
        annee: lastYear,
      }));

      const { error: reminderError } = await supabase
        .from("closure_reminders")
        .insert(reminders!);

      if (reminderError) {
        console.error("Error creating reminders:", reminderError);
      }
    }

    console.log(`✅ Sent ${notifications?.length || 0} closure reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: notifications?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error sending closure reminders:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function getMonthName(month: number): string {
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return months[month - 1];
}
