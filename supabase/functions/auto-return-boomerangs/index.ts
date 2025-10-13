import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting auto-return-boomerangs cron job...");

    // Find all expired boomerangs
    const { data: expiredBoomerangs, error: fetchError } = await supabase
      .from("tasks")
      .select(`
        *,
        boomerang_owner:employees!tasks_boomerang_original_owner_fkey(id, nom, prenom),
        boomerang_holder:employees!tasks_boomerang_current_holder_fkey(id, nom, prenom)
      `)
      .eq("boomerang_active", true)
      .lt("boomerang_deadline", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired boomerangs:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredBoomerangs?.length || 0} expired boomerangs`);

    if (!expiredBoomerangs || expiredBoomerangs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired boomerangs found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Return each expired boomerang
    const results = await Promise.all(
      expiredBoomerangs.map(async (task) => {
        try {
          const historyEntry = {
            from: task.boomerang_current_holder,
            to: task.boomerang_original_owner,
            from_name: task.boomerang_holder ? `${task.boomerang_holder.prenom} ${task.boomerang_holder.nom}` : "",
            to_name: task.boomerang_owner ? `${task.boomerang_owner.prenom} ${task.boomerang_owner.nom}` : "",
            sent_at: task.boomerang_history?.[task.boomerang_history.length - 1]?.sent_at || new Date().toISOString(),
            returned_at: new Date().toISOString(),
            auto_return: true,
          };

          const { error: updateError } = await supabase
            .from("tasks")
            .update({
              boomerang_active: false,
              boomerang_current_holder: null,
              assigned_to: task.boomerang_original_owner,
              boomerang_history: [...(task.boomerang_history || []), historyEntry],
            })
            .eq("id", task.id);

          if (updateError) throw updateError;

          // Notification au propriétaire
          await supabase.from("notifications").insert({
            employee_id: task.boomerang_original_owner,
            titre: "🪃 Boomerang retourné automatiquement",
            message: `Votre boomerang "${task.titre}" est revenu automatiquement (délai expiré)`,
            type: "boomerang_auto_returned",
            url: "/taches",
          });

          // Notification à l'ancien détenteur
          await supabase.from("notifications").insert({
            employee_id: task.boomerang_current_holder,
            titre: "🪃 Boomerang expiré",
            message: `Le boomerang "${task.titre}" a expiré et a été retourné`,
            type: "boomerang_expired",
            url: "/taches",
          });

          console.log(`Successfully returned boomerang for task ${task.id}`);
          return { success: true, taskId: task.id };
        } catch (error: any) {
          console.error(`Error returning boomerang for task ${task.id}:`, error);
          return { success: false, taskId: task.id, error: error?.message || String(error) };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    console.log(`Successfully returned ${successCount}/${results.length} boomerangs`);

    return new Response(
      JSON.stringify({
        message: `Returned ${successCount}/${results.length} boomerangs`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in auto-return-boomerangs:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
