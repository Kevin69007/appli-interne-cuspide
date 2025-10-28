import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { meetingId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get meeting with transcription
    const { data: meeting, error: meetingError } = await supabase
      .from('project_meetings')
      .select('transcription, titre, project:projects!project_meetings_project_id_fkey(titre)')
      .eq('id', meetingId)
      .single();

    if (meetingError) throw meetingError;

    if (!meeting.transcription) {
      throw new Error('No transcription available for this meeting');
    }

    console.log('Generating summary for meeting:', meeting.titre);

    // Call OpenAI GPT-4 for summary
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant qui génère des résumés de réunions professionnelles en français. 
            Crée un résumé structuré avec :
            - Points clés discutés
            - Décisions prises
            - Actions à entreprendre
            - Prochaines étapes
            
            Sois concis et factuel.`
          },
          {
            role: 'user',
            content: `Réunion: ${meeting.titre}
            ${meeting.project ? `Projet: ${meeting.project.titre}` : ''}
            
            Transcription:
            ${meeting.transcription}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error('GPT API error:', gptResponse.status, errorText);
      throw new Error(`GPT API error: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    const resume_ia = gptData.choices[0].message.content;

    console.log('Summary generated, length:', resume_ia.length);

    // Update meeting with summary
    const { error: updateError } = await supabase
      .from('project_meetings')
      .update({ resume_ia })
      .eq('id', meetingId);

    if (updateError) throw updateError;

    // Trigger decision extraction
    await supabase.functions.invoke('extract-meeting-decisions', {
      body: { meetingId },
    });

    return new Response(
      JSON.stringify({ success: true, resume_ia }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-meeting-summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
