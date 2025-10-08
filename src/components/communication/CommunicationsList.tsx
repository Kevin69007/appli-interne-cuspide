import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Communication } from "@/pages/CommunicationGenerale";

interface CommunicationsListProps {
  communications: Communication[];
  onRefresh: () => void;
}

export const CommunicationsList = ({ communications, onRefresh }: CommunicationsListProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette communication ?")) return;

    try {
      const { error } = await supabase
        .from("communications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Communication supprimée",
        description: "La communication a été supprimée avec succès"
      });

      onRefresh();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la communication",
        variant: "destructive"
      });
    }
  };

  const getDestinataireLabel = (comm: Communication) => {
    switch (comm.type_destinataire) {
      case "tout_le_monde":
        return "Tout le monde";
      case "selection_equipe":
        return `Équipes: ${comm.equipes?.join(", ") || "Non spécifié"}`;
      case "groupe":
        return `Groupes: ${comm.groupes?.join(", ") || "Non spécifié"}`;
      default:
        return comm.type_destinataire;
    }
  };

  if (communications.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Aucune communication pour le moment
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {communications.map((comm) => (
        <div key={comm.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{comm.titre}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(comm.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(comm.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm whitespace-pre-wrap">{comm.contenu}</p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {getDestinataireLabel(comm)}
            </Badge>

            {comm.require_confirmation && (
              <Badge variant="secondary">Confirmation requise</Badge>
            )}

            {comm.show_in_calendar && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Dans le calendrier
              </Badge>
            )}

            {comm.date_expiration && (
              <Badge variant="outline">
                Expire le {format(new Date(comm.date_expiration), "dd/MM/yyyy", { locale: fr })}
              </Badge>
            )}

            {!comm.is_active && (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
