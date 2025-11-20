import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { DeclareObjectifDialog } from "./DeclareObjectifDialog";
import { ModifyObjectifDialog } from "./ModifyObjectifDialog";
import { ObjectifsFilters, FilterValues } from "./ObjectifsFilters";

interface Objectif {
  id: string;
  nom: string;
  type_periode: string;
  valeur_cible: number;
  valeur_realisee: number | null;
  unite: string | null;
  periode_debut: string;
  periode_fin: string | null;
  statut: string;
  employee: {
    id: string;
    nom: string;
    prenom: string;
  };
  modifie_par?: {
    nom: string;
    prenom: string;
  };
  raison_modification: string | null;
}

export const ObjectifsIndividuels = () => {
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [filteredObjectifs, setFilteredObjectifs] = useState<Objectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeclareDialog, setShowDeclareDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [selectedObjectif, setSelectedObjectif] = useState<Objectif | null>(null);
  const { isAdmin, isManager } = useUserRole();

  const fetchObjectifs = async () => {
    try {
      setLoading(true);
      
      // Simplifier la requête pour éviter les problèmes de jointure
      const { data: userData } = await supabase.auth.getUser();
      
      let query = supabase
        .from("objectifs_individuels")
        .select("*")
        .order("periode_debut", { ascending: false });

      // Si l'utilisateur n'est ni admin ni manager, filtrer ses propres objectifs
      if (!isAdmin && !isManager) {
        const { data: employeeData } = await supabase
          .from("employees")
          .select("id")
          .eq("user_id", userData.user?.id)
          .single();
        
        if (employeeData) {
          query = query.eq("employee_id", employeeData.id);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error("Erreur requête objectifs:", error);
        throw error;
      }

      // Enrichir avec les données des employés
      if (data && data.length > 0) {
        const employeeIds = [...new Set([
          ...data.map(obj => obj.employee_id),
          ...data.filter(obj => obj.modifie_par).map(obj => obj.modifie_par)
        ])];

        const { data: employeesData } = await supabase
          .from("employees")
          .select("id, nom, prenom")
          .in("id", employeeIds);

        const employeesMap = new Map(employeesData?.map(emp => [emp.id, emp]) || []);

        const enrichedData = data.map(obj => ({
          ...obj,
          employee: employeesMap.get(obj.employee_id) || { id: obj.employee_id, nom: "Inconnu", prenom: "" },
          modifie_par: obj.modifie_par ? employeesMap.get(obj.modifie_par) : undefined
        }));

        setObjectifs(enrichedData as any);
        setFilteredObjectifs(enrichedData as any);
      } else {
        setObjectifs([]);
        setFilteredObjectifs([]);
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des indicateurs");
      console.error("Erreur détaillée:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectifs();
  }, [isAdmin, isManager]);

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      en_cours: "default",
      termine: "secondary",
      modifie: "destructive"
    };
    const labels: Record<string, string> = {
      en_cours: "En cours",
      termine: "Terminé",
      modifie: "Modifié"
    };
    return <Badge variant={variants[statut] || "default"}>{labels[statut] || statut}</Badge>;
  };

  const getTypePeriodeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Journalier",
      weekly: "Hebdomadaire",
      monthly: "Mensuel"
    };
    return labels[type] || type;
  };

  const handleModify = (objectif: Objectif) => {
    setSelectedObjectif(objectif);
    setShowModifyDialog(true);
  };

  const handleFilterChange = (filters: FilterValues) => {
    let filtered = [...objectifs];

    if (filters.employeeId && filters.employeeId !== "all") {
      filtered = filtered.filter(obj => obj.employee.id === filters.employeeId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(obj => obj.periode_debut >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter(obj => obj.periode_debut <= filters.endDate);
    }

    if (filters.typePeriode && filters.typePeriode !== "all") {
      filtered = filtered.filter(obj => obj.type_periode === filters.typePeriode);
    }

    if (filters.statut && filters.statut !== "all") {
      filtered = filtered.filter(obj => obj.statut === filters.statut);
    }

    setFilteredObjectifs(filtered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Indicateurs individuels</h3>
        {!isAdmin && !isManager && (
          <Button onClick={() => setShowDeclareDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Déclarer un indicateur
          </Button>
        )}
      </div>

      <ObjectifsFilters onFilterChange={handleFilterChange} objectifs={filteredObjectifs} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Indicateur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead>Réalisé</TableHead>
              <TableHead>Statut</TableHead>
              {(isAdmin || isManager) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredObjectifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Aucun indicateur déclaré
                </TableCell>
              </TableRow>
            ) : (
              filteredObjectifs.map((objectif) => (
                <TableRow key={objectif.id}>
                  <TableCell>
                    {objectif.employee.prenom} {objectif.employee.nom}
                  </TableCell>
                  <TableCell className="font-medium">{objectif.nom}</TableCell>
                  <TableCell>{getTypePeriodeLabel(objectif.type_periode)}</TableCell>
                  <TableCell>
                    {format(new Date(objectif.periode_debut), "dd/MM/yy", { locale: fr })}
                    {objectif.periode_fin && ` - ${format(new Date(objectif.periode_fin), "dd/MM/yy", { locale: fr })}`}
                  </TableCell>
                  <TableCell>
                    {objectif.valeur_cible} {objectif.unite || ""}
                  </TableCell>
                  <TableCell>
                    {objectif.valeur_realisee !== null 
                      ? `${objectif.valeur_realisee} ${objectif.unite || ""}`
                      : "-"
                    }
                  </TableCell>
                  <TableCell>{getStatutBadge(objectif.statut)}</TableCell>
                  {(isAdmin || isManager) && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModify(objectif)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {objectif.raison_modification && (
                          <Button variant="ghost" size="sm" title={objectif.raison_modification}>
                            <History className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeclareObjectifDialog
        open={showDeclareDialog}
        onOpenChange={setShowDeclareDialog}
        onSuccess={fetchObjectifs}
      />

      {selectedObjectif && (
        <ModifyObjectifDialog
          open={showModifyDialog}
          onOpenChange={setShowModifyDialog}
          objectif={selectedObjectif}
          onSuccess={fetchObjectifs}
        />
      )}
    </div>
  );
};
