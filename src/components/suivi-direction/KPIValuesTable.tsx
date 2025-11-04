import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUserRole } from "@/hooks/useUserRole";
import { SaisieKPIValueDialog } from "./SaisieKPIValueDialog";

interface KPIValue {
  id: string;
  valeur: number;
  periode_debut: string;
  periode_fin: string | null;
  notes: string | null;
  kpi: {
    nom: string;
    type_donnee: string;
  };
  saisi_par: {
    nom: string;
    prenom: string;
  } | null;
}

export const KPIValuesTable = ({ onSuccess }: { onSuccess: () => void }) => {
  const [values, setValues] = useState<KPIValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaisieDialog, setShowSaisieDialog] = useState(false);
  const { isAdmin, isManager } = useUserRole();

  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("kpi_values")
        .select(`
          id,
          valeur,
          periode_debut,
          periode_fin,
          notes,
          kpi:kpi_definitions!kpi_values_kpi_id_fkey(nom, type_donnee),
          saisi_par:employees!kpi_values_saisi_par_fkey(nom, prenom)
        `)
        .order("periode_debut", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setValues(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des valeurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case "percentage":
        return `${value}%`;
      case "currency":
        return `${value.toLocaleString("fr-FR")} €`;
      case "integer":
        return Math.round(value).toString();
      default:
        return value.toString();
    }
  };

  const handleSuccess = () => {
    fetchValues();
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowSaisieDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Saisir une valeur
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Saisi par</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : values.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune valeur saisie
                </TableCell>
              </TableRow>
            ) : (
              values.map((value) => (
                <TableRow key={value.id}>
                  <TableCell className="font-medium">{value.kpi.nom}</TableCell>
                  <TableCell>{formatValue(value.valeur, value.kpi.type_donnee)}</TableCell>
                  <TableCell>
                    {format(new Date(value.periode_debut), "dd/MM/yyyy", { locale: fr })}
                    {value.periode_fin && ` - ${format(new Date(value.periode_fin), "dd/MM/yyyy", { locale: fr })}`}
                  </TableCell>
                  <TableCell>
                    {value.saisi_par
                      ? `${value.saisi_par.prenom} ${value.saisi_par.nom}`
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{value.notes || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SaisieKPIValueDialog
        open={showSaisieDialog}
        onOpenChange={setShowSaisieDialog}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
