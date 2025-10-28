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

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('project_meetings')
      .select('audio_url, fichier_audio_url')
      .eq('id', meetingId)
      .single();

    if (meetingError) throw meetingError;

    const audioUrl = meeting.audio_url || meeting.fichier_audio_url;
    if (!audioUrl) {
      throw new Error('No audio file found for this meeting');
    }

    console.log('Downloading audio from:', audioUrl);

    // Download audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio file');
    }

    const audioBlob = await audioResponse.blob();
    const formData = new FormData();
    formData.append('file', audioBlob, 'meeting.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'fr');

    console.log('Sending to OpenAI Whisper...');

    // Call OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('Whisper API error:', whisperResponse.status, errorText);
      throw new Error(`Whisper API error: ${whisperResponse.status}`);
    }

    const whisperData = await whisperResponse.json();
    const transcription = whisperData.text;

    console.log('Transcription completed, length:', transcription.length);

    // Update meeting with transcription
    const { error: updateError } = await supabase
      .from('project_meetings')
      .update({ transcription })
      .eq('id', meetingId);

    if (updateError) throw updateError;

    // Trigger summary generation
    await supabase.functions.invoke('generate-meeting-summary', {
      body: { meetingId },
    });

    return new Response(
      JSON.stringify({ success: true, transcription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcribe-meeting-audio:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
