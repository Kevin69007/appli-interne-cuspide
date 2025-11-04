import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPIChart } from "../dashboard/KPIChart";
import { KPIPeriodFilter, PeriodFilterValue } from "../shared/KPIPeriodFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format, eachMonthOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { calculateCumul, getComparisonData } from "@/lib/kpiCalculations";

interface KPIDefinition {
  id: string;
  nom: string;
  type_donnee: string;
}

export const KPIAnalysisView = () => {
  const [period, setPeriod] = useState<PeriodFilterValue>({
    dateDebut: startOfMonth(new Date()),
    dateFin: endOfMonth(new Date()),
    comparePreviousPeriod: false,
    comparePreviousYear: true,
  });

  const [kpiDefinitions, setKpiDefinitions] = useState<KPIDefinition[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [chartType, setChartType] = useState<"line" | "bar" | "cumulative">("line");
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKPIDefinitions();
  }, []);

  useEffect(() => {
    if (selectedKPIs.length > 0) {
      fetchChartData();
    }
  }, [selectedKPIs, period, chartType]);

  const fetchKPIDefinitions = async () => {
    try {
      const { data, error } = await supabase
        .from("kpi_definitions")
        .select("id, nom, type_donnee")
        .eq("is_active", true)
        .order("nom");

      if (error) throw error;
      setKpiDefinitions(data || []);

      // Sélectionner automatiquement les KPI prioritaires
      const priorityKPIs = data?.filter(k =>
        ["CA Facturé", "CA Encaissé", "Dépenses"].includes(k.nom)
      );
      if (priorityKPIs && priorityKPIs.length > 0) {
        setSelectedKPIs(priorityKPIs.map(k => k.id));
      }
    } catch (error) {
      console.error("Error fetching KPI definitions:", error);
      toast.error("Erreur lors du chargement des KPI");
    }
  };

  const fetchChartData = async () => {
    if (selectedKPIs.length === 0) return;

    try {
      setLoading(true);

      // Générer les mois de la période
      const months = eachMonthOfInterval({
        start: period.dateDebut,
        end: period.dateFin,
      });

      const dataByKPI: Record<string, any[]> = {};

      for (const kpiId of selectedKPIs) {
        const kpiDef = kpiDefinitions.find(k => k.id === kpiId);
        if (!kpiDef) continue;

        const monthlyData = [];

        for (const month of months) {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);

          // Valeur du mois
          const { data: monthData } = await supabase
            .from("kpi_values")
            .select("valeur")
            .eq("kpi_id", kpiId)
            .gte("periode_debut", format(monthStart, "yyyy-MM-dd"))
            .lte("periode_debut", format(monthEnd, "yyyy-MM-dd"))
            .order("periode_debut", { ascending: false })
            .limit(1)
            .single();

          let previousYearValue = null;
          if (period.comparePreviousYear) {
            const prevYearMonth = new Date(month);
            prevYearMonth.setFullYear(prevYearMonth.getFullYear() - 1);
            const prevMonthStart = startOfMonth(prevYearMonth);
            const prevMonthEnd = endOfMonth(prevYearMonth);

            const { data: prevData } = await supabase
              .from("kpi_values")
              .select("valeur")
              .eq("kpi_id", kpiId)
              .gte("periode_debut", format(prevMonthStart, "yyyy-MM-dd"))
              .lte("periode_debut", format(prevMonthEnd, "yyyy-MM-dd"))
              .order("periode_debut", { ascending: false })
              .limit(1)
              .single();

            previousYearValue = prevData?.valeur || null;
          }

          monthlyData.push({
            date: format(month, "MMM yyyy", { locale: fr }),
            currentValue: monthData?.valeur || 0,
            previousValue: previousYearValue,
            kpiName: kpiDef.nom,
          });
        }

        // Calcul du cumul si nécessaire
        if (chartType === "cumulative") {
          const cumulData = calculateCumul(
            monthlyData.map(d => ({ date: d.date, valeur: d.currentValue }))
          );
          monthlyData.forEach((d, i) => {
            d.currentValue = cumulData[i].cumul;
          });

          if (period.comparePreviousYear) {
            const prevCumulData = calculateCumul(
              monthlyData.map(d => ({ date: d.date, valeur: d.previousValue || 0 }))
            );
            monthlyData.forEach((d, i) => {
              d.previousValue = prevCumulData[i].cumul;
            });
          }
        }

        dataByKPI[kpiId] = monthlyData;
      }

      // Merge data for multiple KPIs
      if (selectedKPIs.length === 1) {
        setChartData(dataByKPI[selectedKPIs[0]] || []);
      } else {
        // Pour plusieurs KPIs, on garde séparé pour l'instant
        setChartData(dataByKPI[selectedKPIs[0]] || []);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleKPIToggle = (kpiId: string) => {
    setSelectedKPIs(prev =>
      prev.includes(kpiId)
        ? prev.filter(id => id !== kpiId)
        : [...prev, kpiId]
    );
  };

  const handleExportPNG = () => {
    toast.info("Export PNG - Fonctionnalité à venir");
  };

  const selectedKPIInfo = kpiDefinitions.find(k => k.id === selectedKPIs[0]);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres d'analyse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <KPIPeriodFilter value={period} onChange={setPeriod} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sélection des KPI</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {kpiDefinitions.map((kpi) => (
                  <div key={kpi.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={kpi.id}
                      checked={selectedKPIs.includes(kpi.id)}
                      onCheckedChange={() => handleKPIToggle(kpi.id)}
                    />
                    <Label htmlFor={kpi.id} className="font-normal cursor-pointer">
                      {kpi.nom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de graphique</Label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Courbe (évolution)</SelectItem>
                  <SelectItem value="bar">Barres (comparaison)</SelectItem>
                  <SelectItem value="cumulative">Cumul progressif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graphique */}
      {selectedKPIs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedKPIInfo?.nom || "KPI"}
                {period.comparePreviousYear && " (Comparaison N vs N-1)"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportPNG}>
                <Download className="h-4 w-4 mr-2" />
                Exporter PNG
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <KPIChart
                data={chartData}
                kpiName={selectedKPIInfo?.nom || "KPI"}
                chartType={chartType}
                showComparison={period.comparePreviousYear}
                unit={selectedKPIInfo?.type_donnee || "number"}
                height={400}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedKPIs.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
            Sélectionnez au moins un KPI pour afficher les graphiques
          </CardContent>
        </Card>
      )}
    </div>
  );
};
