import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find meetings that were deleted more than 30 days ago
    const { data: meetingsToDelete, error: fetchError } = await supabase
      .from("project_meetings")
      .select("id, audio_url, fichier_audio_url")
      .not("deleted_at", "is", null)
      .lt("deleted_at", thirtyDaysAgo.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${meetingsToDelete?.length || 0} meetings to delete permanently`);

    let deletedCount = 0;
    let audioDeletedCount = 0;

    for (const meeting of meetingsToDelete || []) {
      // Delete audio file from storage if exists
      const audioUrl = meeting.audio_url || meeting.fichier_audio_url;
      if (audioUrl) {
        try {
          // Extract file path from URL
          const urlParts = audioUrl.split("/meetings/");
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            const { error: storageError } = await supabase.storage
              .from("meetings")
              .remove([filePath]);

            if (!storageError) {
              audioDeletedCount++;
              console.log(`Deleted audio file: ${filePath}`);
            }
          }
        } catch (error) {
          console.error(`Error deleting audio for meeting ${meeting.id}:`, error);
        }
      }

      // Delete meeting record
      const { error: deleteError } = await supabase
        .from("project_meetings")
        .delete()
        .eq("id", meeting.id);

      if (!deleteError) {
        deletedCount++;
      } else {
        console.error(`Error deleting meeting ${meeting.id}:`, deleteError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedMeetings: deletedCount,
        deletedAudioFiles: audioDeletedCount,
        message: `Successfully deleted ${deletedCount} meetings and ${audioDeletedCount} audio files`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in cleanup-archived-meetings:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
