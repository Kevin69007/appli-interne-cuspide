import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatKPIValue } from "@/lib/kpiCalculations";
import { CreateObjectifDialog } from "./CreateObjectifDialog";
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

interface Objectif {
  id: string;
  kpi_id: string;
  periode_debut: string;
  periode_fin: string | null;
  valeur_objectif: number;
  type_periode: string;
  kpi_definitions: {
    nom: string;
    type_donnee: string;
  };
}

export const KPIObjectifsConfig = () => {
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchObjectifs();
  }, []);

  const fetchObjectifs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kpi_objectifs")
        .select(`
          *,
          kpi_definitions!inner (nom, type_donnee)
        `)
        .order("periode_debut", { ascending: false });

      if (error) throw error;
      setObjectifs(data || []);
    } catch (error) {
      console.error("Error fetching objectifs:", error);
      toast.error("Erreur lors du chargement des objectifs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("kpi_objectifs")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Objectif supprimé");
      fetchObjectifs();
    } catch (error) {
      console.error("Error deleting objectif:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  };

  const getTypePeriodeLabel = (type: string) => {
    switch (type) {
      case "monthly":
        return "Mensuel";
      case "yearly":
        return "Annuel";
      case "weekly":
        return "Hebdomadaire";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs KPI
          </CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Définir un objectif
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Période</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : objectifs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucun objectif défini
                </TableCell>
              </TableRow>
            ) : (
              objectifs.map((objectif) => (
                <TableRow key={objectif.id}>
                  <TableCell className="font-medium">
                    {objectif.kpi_definitions.nom}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatKPIValue(
                      objectif.valeur_objectif,
                      objectif.kpi_definitions.type_donnee
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getTypePeriodeLabel(objectif.type_periode)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(objectif.periode_debut), "dd/MM/yyyy", { locale: fr })}
                    {objectif.periode_fin && (
                      <> - {format(new Date(objectif.periode_fin), "dd/MM/yyyy", { locale: fr })}</>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(objectif.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <CreateObjectifDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchObjectifs}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet objectif ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
