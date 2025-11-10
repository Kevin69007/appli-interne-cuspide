import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Users, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MeetingTranscription } from "@/components/reunions/MeetingTranscription";
import { MeetingDecisions } from "@/components/reunions/MeetingDecisions";
import { AudioPlayerWithTimestamps } from "@/components/reunions/AudioPlayerWithTimestamps";
import { EditMeetingDialog } from "@/components/reunions/EditMeetingDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Meeting {
  id: string;
  project_id?: string;
  project_ids?: string[];
  titre: string;
  date_reunion: string;
  duree_minutes?: number;
  participants: any;
  notes?: string;
  transcription?: string;
  resume_ia?: string;
  audio_url?: string;
  fichier_audio_url?: string;
  created_by?: string;
  project?: {
    titre: string;
  };
}

const ReunionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [timestamps, setTimestamps] = useState<any[]>([]);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMeeting();
      fetchTimestamps();
    }
  }, [id]);

  useEffect(() => {
    if (meeting) {
      checkEditPermission();
    }
  }, [meeting, isAdmin]);

  const checkEditPermission = async () => {
    if (!meeting) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCanEdit(isAdmin || meeting.created_by === user.id);
    }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("project_meetings")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id,
        })
        .eq("id", meeting.id);

      if (error) throw error;

      toast({
        title: "Réunion archivée",
        description: "La réunion sera supprimée définitivement dans 30 jours",
      });

      navigate("/reunions");
    } catch (error: any) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réunion",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const fetchMeeting = async () => {
    try {
      const { data, error } = await supabase
        .from("project_meetings")
        .select(`
          *,
          project:projects(titre)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Convert Json types to proper types
      const meetingData: Meeting = {
        ...data,
        project_ids: Array.isArray(data.project_ids) 
          ? (data.project_ids as string[]) 
          : null,
      };
      
      setMeeting(meetingData);

      // Fetch participant names if they are UUIDs
      if (data.participants) {
        try {
          const participantsStr = typeof data.participants === 'string' 
            ? data.participants 
            : JSON.stringify(data.participants);
          const participantIds = JSON.parse(participantsStr);
          
          if (Array.isArray(participantIds) && participantIds.length > 0) {
            if (typeof participantIds[0] === 'string' && participantIds[0].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              const { data: employeesData } = await supabase
                .from("employees")
                .select("nom, prenom")
                .in("id", participantIds);

              if (employeesData) {
                setParticipantNames(employeesData.map(emp => `${emp.prenom} ${emp.nom}`));
              }
            } else {
              // Old format: names as strings
              setParticipantNames(participantIds);
            }
          }
        } catch (e) {
          // Old format: comma-separated string - try converting to string first
          const participantsStr = typeof data.participants === 'string' 
            ? data.participants 
            : String(data.participants);
          if (participantsStr) {
            setParticipantNames(participantsStr.split(",").map(p => p.trim()).filter(Boolean));
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la réunion",
        variant: "destructive",
      });
      navigate("/reunions");
      setLoading(false);
    }
  };

  const fetchTimestamps = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("meeting_timestamps")
        .select(`
          id,
          timestamp_seconds,
          note,
          projects (
            id,
            titre
          ),
          tasks (
            id,
            titre
          )
        `)
        .eq("meeting_id", id)
        .order("timestamp_seconds");

      if (error) throw error;

      const formattedTimestamps = data?.map((ts: any) => ({
        id: ts.id,
        timestamp_seconds: ts.timestamp_seconds,
        note: ts.note,
        project_titre: ts.projects?.titre,
        task_titre: ts.tasks?.titre,
      })) || [];

      setTimestamps(formattedTimestamps);
    } catch (error) {
      console.error("Error fetching timestamps:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Chargement...</div>
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="outline" size="icon" onClick={() => navigate("/reunions")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{meeting.titre}</h1>
              {meeting.project && (
                <p className="text-muted-foreground">Projet: {meeting.project.titre}</p>
              )}
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}
        </div>

        {/* Meeting info */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(meeting.date_reunion), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
            </div>
            
            {meeting.duree_minutes && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{meeting.duree_minutes} minutes</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                {participantNames.length > 0
                  ? `${participantNames.length} participant(s)`
                  : "Aucun participant"}
              </span>
            </div>
          </div>

          {meeting.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          )}

          {participantNames.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-semibold mb-2">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {participantNames.map((name, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio player */}
        {(meeting.audio_url || meeting.fichier_audio_url) && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Enregistrement audio</h2>
            {timestamps.length > 0 ? (
              <AudioPlayerWithTimestamps
                audioUrl={meeting.audio_url || meeting.fichier_audio_url}
                timestamps={timestamps}
                canDownload={isAdmin}
              />
            ) : (
              <div className="bg-card rounded-lg border border-border p-6">
                <audio 
                  controls 
                  className="w-full"
                  controlsList={isAdmin ? undefined : "nodownload"}
                  onContextMenu={isAdmin ? undefined : (e) => e.preventDefault()}
                >
                  <source src={meeting.audio_url || meeting.fichier_audio_url} type="audio/mpeg" />
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Téléchargement réservé aux administrateurs
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transcription */}
        {meeting.transcription && (
          <MeetingTranscription transcription={meeting.transcription} />
        )}

        {/* AI Summary */}
        {meeting.resume_ia && (
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <h3 className="font-semibold mb-4">Résumé IA</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{meeting.resume_ia}</p>
          </div>
        )}

        {/* AI Decisions */}
        <MeetingDecisions meetingId={meeting.id} />

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette réunion ?</AlertDialogTitle>
              <AlertDialogDescription>
                La réunion sera archivée et supprimée définitivement dans 30 jours.
                Vous pourrez la récupérer avant cette date.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <EditMeetingDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          meetingId={meeting.id}
          onSuccess={() => {
            setShowEditDialog(false);
            fetchMeeting();
            toast({
              title: "Réunion modifiée",
              description: "Les modifications ont été enregistrées",
            });
          }}
        />
      </div>
    </div>
  );
};

export default ReunionDetails;
