import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, FileAudio } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Meeting {
  id: string;
  titre: string;
  date_reunion: string;
  duree_minutes?: number;
  participants: any;
  transcription?: string;
  audio_url?: string;
  fichier_audio_url?: string;
  project?: {
    titre: string;
  };
}

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
}

export const MeetingCard = ({ meeting, onClick }: MeetingCardProps) => {
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const getParticipantCount = async () => {
      if (!meeting.participants) {
        setParticipantCount(0);
        return;
      }

      try {
        const participantIds = JSON.parse(meeting.participants);
        if (Array.isArray(participantIds)) {
          setParticipantCount(participantIds.length);
        }
      } catch (e) {
        // Old format: comma-separated string
        setParticipantCount(meeting.participants.split(",").filter(p => p.trim()).length);
      }
    };

    getParticipantCount();
  }, [meeting.participants]);

  return (
    <Card
      className="p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{meeting.titre}</h3>
          {meeting.project && (
            <Badge variant="outline" className="text-xs">
              {meeting.project.titre}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(meeting.date_reunion), "dd MMMM yyyy", { locale: fr })}
            </span>
          </div>
          
          {meeting.duree_minutes && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{meeting.duree_minutes} minutes</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{participantCount} participant(s)</span>
          </div>

          {(meeting.audio_url || meeting.fichier_audio_url) && (
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4" />
              <span>Audio disponible</span>
            </div>
          )}
        </div>

        {meeting.transcription && (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            ✓ Transcrite
          </Badge>
        )}
      </div>
    </Card>
  );
};
