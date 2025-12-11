import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Users, Calendar, Eye, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Communication } from "@/pages/CommunicationGenerale";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommunicationsListProps {
  communications: Communication[];
  onRefresh: () => void;
}

interface ReadStatus {
  employee_name: string;
  lu_at: string;
}

interface UnreadEmployee {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

export const CommunicationsList = ({ communications, onRefresh }: CommunicationsListProps) => {
  const { toast } = useToast();
  const [selectedComm, setSelectedComm] = useState<string | null>(null);
  const [readStatuses, setReadStatuses] = useState<ReadStatus[]>([]);
  const [unreadEmployees, setUnreadEmployees] = useState<UnreadEmployee[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

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

  const handleViewReadStatus = async (commId: string) => {
    setSelectedComm(commId);
    setLoadingStatuses(true);

    try {
      // Récupérer les lectures
      const { data: lectures, error: lecturesError } = await supabase
        .from("communication_lectures")
        .select(`
          lu_at,
          employee_id,
          employees (
            nom,
            prenom
          )
        `)
        .eq("communication_id", commId);

      if (lecturesError) throw lecturesError;

      const readList: ReadStatus[] = lectures?.map((l: any) => ({
        employee_name: `${l.employees.prenom} ${l.employees.nom}`,
        lu_at: l.lu_at
      })) || [];

      setReadStatuses(readList);

      // Récupérer tous les employés éligibles
      const comm = communications.find(c => c.id === commId);
      if (!comm) return;

      let employeesQuery = supabase
        .from("employees")
        .select("id, nom, prenom, email, equipe, poste");

      if (comm.type_destinataire === "selection_equipe" && comm.equipes) {
        employeesQuery = employeesQuery.in("equipe", comm.equipes);
      } else if (comm.type_destinataire === "groupe" && comm.groupes) {
        // Pour les groupes, on doit vérifier les postes ou roles
        employeesQuery = employeesQuery.in("poste", comm.groupes);
      }

      const { data: allEmployees, error: empError } = await employeesQuery;
      if (empError) throw empError;

      // Filtrer ceux qui n'ont pas lu
      const readEmployeeIds = new Set(lectures?.map((l: any) => l.employee_id));
      const unread = allEmployees?.filter(e => !readEmployeeIds.has(e.id)) || [];
      setUnreadEmployees(unread);

    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statuts de lecture",
        variant: "destructive"
      });
    } finally {
      setLoadingStatuses(false);
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
    <>
      <div className="space-y-3 sm:space-y-4">
        {communications.map((comm) => (
          <div key={comm.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-lg line-clamp-2">{comm.titre}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {format(new Date(comm.created_at), "dd MMM yyyy", { locale: fr })}
                  <span className="hidden sm:inline"> à {format(new Date(comm.created_at), "HH:mm", { locale: fr })}</span>
                </p>
              </div>
              <div className="flex gap-1 sm:gap-2 shrink-0">
                {comm.require_confirmation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewReadStatus(comm.id)}
                    title="Voir le statut de lecture"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(comm.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs sm:text-sm whitespace-pre-wrap line-clamp-3 sm:line-clamp-none">{comm.contenu}</p>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge variant="outline" className="flex items-center gap-1 text-[10px] sm:text-xs">
                <Users className="h-3 w-3" />
                <span className="truncate max-w-[120px] sm:max-w-none">{getDestinataireLabel(comm)}</span>
              </Badge>

              {comm.require_confirmation && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">Confirmation</Badge>
              )}

              {comm.show_in_calendar && (
                <Badge variant="secondary" className="flex items-center gap-1 text-[10px] sm:text-xs">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">Dans le calendrier</span>
                  <span className="sm:hidden">Cal.</span>
                </Badge>
              )}

              {comm.date_expiration && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  <span className="hidden sm:inline">Expire le </span>{format(new Date(comm.date_expiration), "dd/MM/yyyy", { locale: fr })}
                </Badge>
              )}

              {!comm.is_active && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs">Inactive</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selectedComm !== null} onOpenChange={() => setSelectedComm(null)}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] sm:w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Statut de lecture</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Suivi des confirmations de lecture
            </DialogDescription>
          </DialogHeader>

          {loadingStatuses ? (
            <p className="text-center py-8">Chargement...</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Lu par ({readStatuses.length})
                </h4>
                {readStatuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune lecture confirmée</p>
                ) : (
                  <div className="space-y-2">
                    {readStatuses.map((status, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-b border-border pb-2">
                        <span>{status.employee_name}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(status.lu_at), "d MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  Non lu par ({unreadEmployees.length})
                </h4>
                {unreadEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tous les destinataires ont confirmé la lecture</p>
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
