import { MeetingCard } from "./MeetingCard";

interface Meeting {
  id: string;
  project_id: string;
  titre: string;
  date_reunion: string;
  duree_minutes?: number;
  participants: any;
  transcription?: string;
  resume_ia?: string;
  audio_url?: string;
  fichier_audio_url?: string;
  created_at: string;
  project?: {
    titre: string;
  };
}

interface MeetingsListProps {
  meetings: Meeting[];
  onMeetingClick: (id: string) => void;
  onRefresh?: () => void;
}

export const MeetingsList = ({ meetings, onMeetingClick, onRefresh }: MeetingsListProps) => {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">Aucune réunion enregistrée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onClick={() => onMeetingClick(meeting.id)}
          onDeleted={onRefresh}
          onEdited={onRefresh}
        />
      ))}
    </div>
  );
};
