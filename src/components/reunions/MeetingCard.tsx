import { Card } from "@/components/ui/card";
import { Calendar, Clock, Users, FileAudio, Pencil, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
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
import { EditMeetingDialog } from "./EditMeetingDialog";

interface Meeting {
  id: string;
  titre: string;
  date_reunion: string;
  duree_minutes?: number;
  participants: any;
  transcription?: string;
  audio_url?: string;
  fichier_audio_url?: string;
  created_by?: string;
  deleted_at?: string;
  project?: {
    titre: string;
  };
}

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
  onDeleted?: () => void;
  onEdited?: () => void;
  isArchived?: boolean;
}

export const MeetingCard = ({ meeting, onClick, onDeleted, onEdited, isArchived = false }: MeetingCardProps) => {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [participantCount, setParticipantCount] = useState(0);
  const [canEdit, setCanEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

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
        setParticipantCount(meeting.participants.split(",").filter((p: string) => p.trim()).length);
      }
    };

    getParticipantCount();

    // Check if user can edit this meeting
    const checkEditPermission = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCanEdit(isAdmin || meeting.created_by === user.id);
      }
    };
    checkEditPermission();
  }, [meeting.participants, meeting.created_by, isAdmin]);

  const handleDelete = async () => {
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

      onDeleted?.();
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

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const { error } = await supabase
        .from("project_meetings")
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq("id", meeting.id);

      if (error) throw error;

      toast({
        title: "Réunion restaurée",
        description: "La réunion a été restaurée avec succès",
      });

      onDeleted?.();
    } catch (error: any) {
      console.error("Error restoring meeting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de restaurer la réunion",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
      setShowRestoreDialog(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <Card
        className="p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer relative"
        onClick={onClick}
      >
        {(canEdit || isArchived) && (
          <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            {isArchived ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRestoreDialog(true);
                }}
                className="h-8 w-8"
                disabled={restoring}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteClick}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="pr-20">
              <h3 className="font-semibold text-lg mb-1">{meeting.titre}</h3>
              {meeting.project && (
                <Badge variant="outline" className="text-xs">
                  {meeting.project.titre}
                </Badge>
              )}
            </div>
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

          {isArchived && meeting.deleted_at && (
            <Badge variant="destructive" className="text-xs">
              Archivée le {format(new Date(meeting.deleted_at), "dd/MM/yyyy", { locale: fr })}
            </Badge>
          )}
        </div>
      </Card>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer cette réunion ?</AlertDialogTitle>
            <AlertDialogDescription>
              La réunion sera restaurée dans les réunions actives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <EditMeetingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        meetingId={meeting.id}
        onSuccess={() => {
          onEdited?.();
        }}
      />
    </>
  );
};
