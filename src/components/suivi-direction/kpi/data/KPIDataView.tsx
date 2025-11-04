import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatKPIValue, calculateVariation, calculateObjectifProgress } from "@/lib/kpiCalculations";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SaisieKPIValueDialog } from "../../SaisieKPIValueDialog";
import { useUserRole } from "@/hooks/useUserRole";
import * as XLSX from "xlsx";

interface KPIValue {
  id: string;
  kpi_id: string;
  valeur: number;
  periode_debut: string;
  periode_fin: string | null;
  notes: string | null;
  kpi_definitions: {
    nom: string;
    type_donnee: string;
  };
  employees: {
    prenom: string;
    nom: string;
  } | null;
  objectif?: number;
}

export const KPIDataView = () => {
  const [values, setValues] = useState<KPIValue[]>([]);
  const [filteredValues, setFilteredValues] = useState<KPIValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKPI, setSelectedKPI] = useState<string>("all");
  const [kpiDefinitions, setKpiDefinitions] = useState<any[]>([]);
  const [showSaisieDialog, setShowSaisieDialog] = useState(false);
  const { isAdmin, isManager } = useUserRole();

  useEffect(() => {
    fetchKPIDefinitions();
    fetchValues();
  }, []);

  useEffect(() => {
    filterValues();
  }, [values, searchTerm, selectedKPI]);

  const fetchKPIDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from("kpi_definitions")
        .select("id, nom")
        .eq("is_active", true)
        .order("nom");

      if (error) throw error;
      setKpiDefinitions(data || []);
    } catch (error) {
      console.error("Error fetching KPI definitions:", error);
    }
  };

  const fetchValues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kpi_values")
        .select(`
          *,
          kpi_definitions!inner (nom, type_donnee),
          employees (prenom, nom)
        `)
        .order("periode_debut", { ascending: false });

      if (error) throw error;

      // Fetch objectifs for each value
      const valuesWithObjectifs = await Promise.all(
        (data || []).map(async (value) => {
          const { data: objectifData } = await supabase
            .from("kpi_objectifs")
            .select("valeur_objectif")
            .eq("kpi_id", value.kpi_id)
            .lte("periode_debut", value.periode_debut)
            .or(`periode_fin.is.null,periode_fin.gte.${value.periode_debut}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...value,
            objectif: objectifData?.valeur_objectif,
          };
        })
      );

      setValues(valuesWithObjectifs);
    } catch (error) {
      console.error("Error fetching values:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const filterValues = () => {
    let filtered = [...values];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.kpi_definitions.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par KPI
    if (selectedKPI !== "all") {
      filtered = filtered.filter((v) => v.kpi_id === selectedKPI);
    }

    setFilteredValues(filtered);
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredValues.map((v) => ({
        KPI: v.kpi_definitions.nom,
        Valeur: v.valeur,
        "Période début": format(new Date(v.periode_debut), "dd/MM/yyyy", { locale: fr }),
        "Période fin": v.periode_fin ? format(new Date(v.periode_fin), "dd/MM/yyyy", { locale: fr }) : "",
        Objectif: v.objectif || "",
        "Écart objectif": v.objectif ? ((v.valeur / v.objectif) * 100).toFixed(1) + "%" : "",
        "Saisi par": v.employees ? `${v.employees.prenom} ${v.employees.nom}` : "",
        Notes: v.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Données KPI");
      XLSX.writeFile(wb, `donnees_kpi_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

      toast.success("Export Excel réussi");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const handleSuccess = () => {
    fetchValues();
  };

  // Calculer la variation avec la valeur précédente
  const getPreviousValue = (currentValue: KPIValue, index: number): number | undefined => {
    if (index === filteredValues.length - 1) return undefined;
    
    const nextValue = filteredValues[index + 1];
    if (nextValue && nextValue.kpi_id === currentValue.kpi_id) {
      return nextValue.valeur;
    }
    return undefined;
  };

  return (
    <div className="space-y-4">
      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 flex-col sm:flex-row w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedKPI} onValueChange={setSelectedKPI}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tous les KPI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les KPI</SelectItem>
              {kpiDefinitions.map((kpi) => (
                <SelectItem key={kpi.id} value={kpi.id}>
                  {kpi.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {(isAdmin || isManager) && (
            <Button onClick={() => setShowSaisieDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Saisir
            </Button>
          )}
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KPI</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Variation</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead>Saisi par</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredValues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune donnée trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredValues.map((value, index) => {
                const previousValue = getPreviousValue(value, index);
                const variation = previousValue !== undefined
                  ? calculateVariation(value.valeur, previousValue)
                  : null;
                const objectifProgress = value.objectif
                  ? calculateObjectifProgress(value.valeur, value.objectif)
                  : null;

                return (
                  <TableRow key={value.id}>
                    <TableCell className="font-medium">
                      {value.kpi_definitions.nom}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatKPIValue(value.valeur, value.kpi_definitions.type_donnee)}
                    </TableCell>
                    <TableCell>
                      {variation && (
                        <div className={`flex items-center gap-1 ${
                          variation.direction === "up" ? "text-green-600" : 
                          variation.direction === "down" ? "text-red-600" : 
                          "text-muted-foreground"
                        }`}>
                          {variation.direction === "up" ? "↑" : variation.direction === "down" ? "↓" : "→"}
                          {variation.percent > 0 ? "+" : ""}
                          {variation.percent.toFixed(1)}%
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(value.periode_debut), "MMM yyyy", { locale: fr })}
                      {value.periode_fin && ` - ${format(new Date(value.periode_fin), "MMM yyyy", { locale: fr })}`}
                    </TableCell>
                    <TableCell>
                      {value.objectif && objectifProgress !== null ? (
                        <div className="space-y-1">
                          <div className="text-sm">
                            {formatKPIValue(value.objectif, value.kpi_definitions.type_donnee)}
                          </div>
                          <Progress value={Math.min(objectifProgress, 100)} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {objectifProgress.toFixed(0)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {value.employees ? (
                        <span className="text-sm">
                          {value.employees.prenom} {value.employees.nom}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {value.notes || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de saisie */}
      {(isAdmin || isManager) && (
        <SaisieKPIValueDialog
          open={showSaisieDialog}
          onOpenChange={setShowSaisieDialog}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
