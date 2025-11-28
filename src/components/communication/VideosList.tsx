import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, Calendar, Eye, Play, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayerDialog } from "./VideoPlayerDialog";

export interface VideoCommunication {
  id: string;
  titre: string;
  video_url: string;
  description?: string | null;
  created_at: string;
  type_destinataire: string;
  equipes?: string[] | null;
  groupes?: string[] | null;
  employee_ids?: string[] | null;
  require_confirmation: boolean;
  date_expiration?: string | null;
  is_active: boolean;
}

interface VideosListProps {
  videos: VideoCommunication[];
  onRefresh: () => void;
}

interface ReadStatus {
  employee_name: string;
  viewed_at: string;
}

interface UnreadEmployee {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

export const VideosList = ({ videos, onRefresh }: VideosListProps) => {
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [readStatuses, setReadStatuses] = useState<ReadStatus[]>([]);
  const [unreadEmployees, setUnreadEmployees] = useState<UnreadEmployee[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<VideoCommunication | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette vidéo ?")) return;

    try {
      const { error } = await supabase
        .from("video_communications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Vidéo supprimée",
        description: "La vidéo a été supprimée avec succès"
      });

      onRefresh();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vidéo",
        variant: "destructive"
      });
    }
  };

  const handleViewReadStatus = async (videoId: string) => {
    setSelectedVideo(videoId);
    setLoadingStatuses(true);

    try {
      const { data: lectures, error: lecturesError } = await supabase
        .from("video_communication_lectures")
        .select(`
          viewed_at,
          employee_id,
          employees (
            nom,
            prenom
          )
        `)
        .eq("video_communication_id", videoId);

      if (lecturesError) throw lecturesError;

      const readList: ReadStatus[] = lectures?.map((l: any) => ({
        employee_name: `${l.employees.prenom} ${l.employees.nom}`,
        viewed_at: l.viewed_at
      })) || [];

      setReadStatuses(readList);

      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      let employeesQuery = supabase
        .from("employees")
        .select("id, nom, prenom, email, equipe, groupe");

      if (video.type_destinataire === "selection_equipe" && video.equipes) {
        employeesQuery = employeesQuery.in("equipe", video.equipes);
      } else if (video.type_destinataire === "groupe" && video.groupes) {
        employeesQuery = employeesQuery.in("groupe", video.groupes);
      } else if (video.type_destinataire === "selection_individuelle" && video.employee_ids) {
        employeesQuery = employeesQuery.in("id", video.employee_ids);
      }

      const { data: allEmployees, error: empError } = await employeesQuery;
      if (empError) throw empError;

      const readEmployeeIds = new Set(lectures?.map((l: any) => l.employee_id));
      const unread = allEmployees?.filter(e => !readEmployeeIds.has(e.id)) || [];
      setUnreadEmployees(unread);

    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statuts de visionnage",
        variant: "destructive"
      });
    } finally {
      setLoadingStatuses(false);
    }
  };

  const getDestinataireLabel = (video: VideoCommunication) => {
    switch (video.type_destinataire) {
      case "tout_le_monde":
        return "Tout le monde";
      case "selection_equipe":
        return `Équipes: ${video.equipes?.join(", ") || "Non spécifié"}`;
      case "groupe":
        return `Groupes: ${video.groupes?.join(", ") || "Non spécifié"}`;
      case "selection_individuelle":
        return `${video.employee_ids?.length || 0} employé(s)`;
      default:
        return video.type_destinataire;
    }
  };

  if (videos.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucune vidéo pour le moment
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {videos.map((video) => (
          <div key={video.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{video.titre}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(video.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
                {video.description && (
                  <p className="text-sm mt-2 text-muted-foreground">{video.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setPlayingVideo(video)}
                  title="Lire la vidéo"
                >
                  <Play className="h-4 w-4" />
                </Button>
                {video.require_confirmation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewReadStatus(video.id)}
                    title="Voir le statut de visionnage"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(video.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getDestinataireLabel(video)}
              </Badge>

              {video.require_confirmation && (
                <Badge variant="secondary">Confirmation requise</Badge>
              )}

              {video.date_expiration && (
                <Badge variant="outline">
                  Expire le {format(new Date(video.date_expiration), "dd/MM/yyyy", { locale: fr })}
                </Badge>
              )}

              {!video.is_active && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {playingVideo && (
        <VideoPlayerDialog
          video={playingVideo}
          open={!!playingVideo}
          onOpenChange={(open) => !open && setPlayingVideo(null)}
          onVideoComplete={onRefresh}
        />
      )}

      <Dialog open={selectedVideo !== null} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Statut de visionnage</DialogTitle>
            <DialogDescription>
              Suivi des confirmations de visionnage pour cette vidéo
            </DialogDescription>
          </DialogHeader>

          {loadingStatuses ? (
            <p className="text-center py-8">Chargement...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Visionné par ({readStatuses.length})
                </h4>
                {readStatuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun visionnage confirmé</p>
                ) : (
                  <div className="space-y-2">
                    {readStatuses.map((status, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b border-border pb-2">
                        <span>{status.employee_name}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(status.viewed_at), "d MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  Non visionné par ({unreadEmployees.length})
                </h4>
                {unreadEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tous les destinataires ont confirmé le visionnage</p>
                ) : (
                  <div className="space-y-2">
                    {unreadEmployees.map((emp) => (
                      <div key={emp.id} className="flex justify-between text-sm border-b border-border pb-2">
                        <span>{emp.prenom} {emp.nom}</span>
                        <span className="text-muted-foreground text-xs">{emp.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};