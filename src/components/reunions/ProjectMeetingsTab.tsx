import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Meeting {
  id: string;
  titre: string;
  date_reunion: string;
  participants?: string;
  timestamps: {
    id: string;
    timestamp_seconds: number;
    note?: string;
    task_titre?: string;
  }[];
}

interface ProjectMeetingsTabProps {
  projectId: string;
}

export const ProjectMeetingsTab = ({ projectId }: ProjectMeetingsTabProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [projectId]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      // Fetch meetings where project_id matches OR project_ids contains this project
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("project_meetings")
        .select("id, titre, date_reunion, participants")
        .or(`project_id.eq.${projectId},project_ids.cs.["${projectId}"]`)
        .order("date_reunion", { ascending: false });

      if (meetingsError) throw meetingsError;

      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([]);
        setLoading(false);
        return;
      }

      const meetingIds = meetingsData.map(m => m.id);

      // Fetch timestamps for these meetings that are related to this project
      const { data: timestampsData, error: timestampsError } = await supabase
        .from("meeting_timestamps")
        .select(`
          id,
          timestamp_seconds,
          note,
          meeting_id,
          tasks (
            id,
            titre
          )
        `)
        .in("meeting_id", meetingIds)
        .eq("project_id", projectId)
        .order("timestamp_seconds");

      if (timestampsError) throw timestampsError;

      // Combine data
      const meetingsWithTimestamps = meetingsData.map((meeting: any) => ({
        ...meeting,
        timestamps: timestampsData
          ?.filter((t: any) => t.meeting_id === meeting.id)
          .map((t: any) => ({
            id: t.id,
            timestamp_seconds: t.timestamp_seconds,
            note: t.note,
            task_titre: t.tasks?.titre,
          })) || [],
      }));

      setMeetings(meetingsWithTimestamps);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Ce projet n'a pas encore été abordé dans des réunions.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{meeting.titre}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(meeting.date_reunion)}
                </div>
                {meeting.participants && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {meeting.participants}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/reunions/${meeting.id}`)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Voir la réunion
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">
              Points abordés ({meeting.timestamps.length})
            </h4>
            <div className="space-y-2">
              {meeting.timestamps.map((ts) => (
                <div
                  key={ts.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge variant="secondary" className="shrink-0 font-mono">
                    {formatTime(ts.timestamp_seconds)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    {ts.task_titre && (
                      <p className="text-sm font-medium mb-1">{ts.task_titre}</p>
                    )}
                    {ts.note && <p className="text-sm text-muted-foreground">{ts.note}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/reunions/${meeting.id}?t=${ts.timestamp_seconds}`)
                    }
                  >
                    Écouter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
