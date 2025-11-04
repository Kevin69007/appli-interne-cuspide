import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface KPI {
  id: string;
  nom: string;
  description: string | null;
  type_donnee: string;
  recurrence: string;
  is_active: boolean;
  responsable: {
    nom: string;
    prenom: string;
  } | null;
}

export const KPIList = ({ onSuccess }: { onSuccess: () => void }) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kpi_definitions")
        .select(`
          id,
          nom,
          description,
          type_donnee,
          recurrence,
          is_active,
          responsable:employees!kpi_definitions_responsable_id_fkey(nom, prenom)
        `)
        .order("nom");

      if (error) throw error;
      setKpis(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des KPI");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeDonneeLabel = (type: string) => {
    const labels: Record<string, string> = {
      number: "Nombre",
      integer: "Entier",
      percentage: "Pourcentage",
      currency: "Devise"
    };
    return labels[type] || type;
  };

  const getRecurrenceLabel = (recurrence: string) => {
    const labels: Record<string, string> = {
      daily: "Quotidien",
      weekly: "Hebdomadaire",
      monthly: "Mensuel"
    };
    return labels[recurrence] || recurrence;
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Récurrence</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Chargement...
              </TableCell>
            </TableRow>
          ) : kpis.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Aucun KPI configuré
              </TableCell>
            </TableRow>
          ) : (
            kpis.map((kpi) => (
              <TableRow key={kpi.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{kpi.nom}</div>
                    {kpi.description && (
                      <div className="text-sm text-muted-foreground">{kpi.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getTypeDonneeLabel(kpi.type_donnee)}</TableCell>
                <TableCell>{getRecurrenceLabel(kpi.recurrence)}</TableCell>
                <TableCell>
                  {kpi.responsable
                    ? `${kpi.responsable.prenom} ${kpi.responsable.nom}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={kpi.is_active ? "default" : "secondary"}>
                    {kpi.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
