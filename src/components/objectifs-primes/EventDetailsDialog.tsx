import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, AlertCircle, FileText, Image as ImageIcon, CheckCircle, XCircle, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EventDetails {
  id: string;
  date: string;
  categorie: string;
  type?: string;
  type_incident?: string;
  type_absence?: string;
  statut_validation?: string;
  motif?: string;
  detail?: string;
  photos?: string[];
  points?: number;
  duree_minutes?: number;
  commentaire_validation?: string;
  gravite?: string;
  statut_objectif?: string;
  employee_id: string;
  auteur_id?: string;
  created_at: string;
}

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

export const EventDetailsDialog = ({ open, onOpenChange, eventId }: EventDetailsDialogProps) => {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && eventId) {
      fetchEventDetails();
    }
  }, [open, eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);
    
    const { data: eventData, error: eventError } = await supabase
      .from("agenda_entries")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!eventError && eventData) {
      setEvent(eventData as EventDetails);

      // Fetch employee name
      const { data: empData } = await supabase
        .from("employees")
        .select("nom, prenom")
        .eq("id", eventData.employee_id)
        .single();

      if (empData) {
        setEmployeeName(`${empData.prenom} ${empData.nom}`);
      }

      // Fetch author name if exists
      if (eventData.auteur_id) {
        const { data: authData } = await supabase
          .from("employees")
          .select("nom, prenom")
          .eq("id", eventData.auteur_id)
          .single();

        if (authData) {
          setAuthorName(`${authData.prenom} ${authData.nom}`);
        }
      }
    }

    setLoading(false);
  };

  const getCategoryLabel = (categorie: string) => {
    const labels: Record<string, string> = {
      objectifs: "Objectif",
      a_faire: "À faire",
      absence: "Absence",
      incident: "Incident"
    };
    return labels[categorie] || categorie;
  };

  const getStatusBadge = (statut?: string) => {
    if (!statut) return null;
    
    const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
      en_attente: { label: "En attente", variant: "outline" },
      valide: { label: "Validé", variant: "default" },
      refuse: { label: "Refusé", variant: "destructive" }
    };

    const config = statusConfig[statut] || { label: statut, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getGravityBadge = (gravite?: string) => {
    if (!gravite) return null;
    
    const gravityConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
      mineure: { label: "Mineure", variant: "outline" },
      moyenne: { label: "Moyenne", variant: "secondary" },
      majeure: { label: "Majeure", variant: "default" },
      critique: { label: "Critique", variant: "destructive" }
    };

    const config = gravityConfig[gravite] || { label: gravite, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {getCategoryLabel(event.categorie)} - {new Date(event.date).toLocaleDateString("fr-FR")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Category */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{getCategoryLabel(event.categorie)}</Badge>
            {event.statut_validation && getStatusBadge(event.statut_validation)}
            {event.gravite && getGravityBadge(event.gravite)}
            {event.statut_objectif && (
              <Badge variant="outline">{event.statut_objectif}</Badge>
            )}
          </div>

          {/* Type specific info */}
          {event.type_incident && (
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Type d'incident:</span>
              <span>{event.type_incident}</span>
            </div>
          )}

          {event.type_absence && (
            <div className="flex items-center gap-2 text-sm">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Type d'absence:</span>
              <span>{event.type_absence}</span>
            </div>
          )}

          {/* Employee */}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Employé:</span>
            <span>{employeeName}</span>
          </div>

          {/* Author if different */}
          {authorName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Créé par:</span>
              <span>{authorName}</span>
            </div>
          )}

          {/* Duration */}
          {event.duree_minutes && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Durée:</span>
              <span>{event.duree_minutes} minutes</span>
            </div>
          )}

          {/* Points */}
          {event.points !== undefined && event.points !== null && (
            <div className="flex items-center gap-2 text-sm">
              {event.points >= 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium">Points:</span>
              <span className={event.points >= 0 ? "text-green-600" : "text-red-600"}>
                {event.points > 0 ? "+" : ""}{event.points}
              </span>
            </div>
          )}

          {/* Motif */}
          {event.motif && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Motif:
              </div>
              <p className="text-sm pl-6">{event.motif}</p>
            </div>
          )}

          {/* Detail */}
          {event.detail && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Détails:
              </div>
              <p className="text-sm pl-6">{event.detail}</p>
            </div>
          )}

          {/* Validation comment */}
          {event.commentaire_validation && (
            <div className="space-y-1 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Commentaire de validation:
              </div>
              <p className="text-sm pl-6">{event.commentaire_validation}</p>
            </div>
          )}

          {/* Photos */}
          {event.photos && event.photos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Photos ({event.photos.length}):
              </div>
              <div className="grid grid-cols-2 gap-2 pl-6">
                {event.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="rounded-lg border w-full h-32 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(photo, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Creation date */}
          <div className="text-xs text-muted-foreground pt-4 border-t">
            Créé le {new Date(event.created_at).toLocaleString("fr-FR")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
