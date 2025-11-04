import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KPICard } from "./KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIPeriodFilter, PeriodFilterValue } from "../shared/KPIPeriodFilter";
import { calculateTresorerieEcart, calculateDecalage, generateSparklineData } from "@/lib/kpiCalculations";
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from "date-fns";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface KPIData {
  currentValue: number;
  previousValue: number;
  sparklineData: number[];
  cumulYearCurrent: number;
  cumulYearPrevious: number;
  objectif?: number;
}

export const KPIDashboardView = () => {
  const [period, setPeriod] = useState<PeriodFilterValue>({
    dateDebut: startOfMonth(new Date()),
    dateFin: endOfMonth(new Date()),
    comparePreviousPeriod: true,
    comparePreviousYear: true,
  });

  const [caFacture, setCaFacture] = useState<KPIData | null>(null);
  const [caEncaisse, setCaEncaisse] = useState<KPIData | null>(null);
  const [depenses, setDepenses] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, [period]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);

      // Récupérer les définitions des KPI
      const { data: kpiDefinitions, error: kpiError } = await supabase
        .from("kpi_definitions")
        .select("*")
        .in("nom", ["CA Facturé", "CA Encaissé", "Dépenses"])
        .eq("is_active", true);

      if (kpiError) throw kpiError;

      if (!kpiDefinitions || kpiDefinitions.length === 0) {
        toast.info("Veuillez créer les KPI 'CA Facturé', 'CA Encaissé' et 'Dépenses' dans la configuration");
        setLoading(false);
        return;
      }

      // Récupérer les données pour chaque KPI
      for (const kpiDef of kpiDefinitions) {
        const data = await fetchKPIValues(kpiDef.id, kpiDef.nom);
        
        if (kpiDef.nom === "CA Facturé") {
          setCaFacture(data);
        } else if (kpiDef.nom === "CA Encaissé") {
          setCaEncaisse(data);
        } else if (kpiDef.nom === "Dépenses") {
          setDepenses(data);
        }
      }
    } catch (error) {
      console.error("Error fetching KPI data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIValues = async (kpiId: string, kpiName: string): Promise<KPIData> => {
    // Valeur période actuelle
    const { data: currentData } = await supabase
      .from("kpi_values")
      .select("valeur")
      .eq("kpi_id", kpiId)
      .gte("periode_debut", format(period.dateDebut, "yyyy-MM-dd"))
      .lte("periode_debut", format(period.dateFin, "yyyy-MM-dd"))
      .order("periode_debut", { ascending: false })
      .limit(1)
      .single();

    // Valeur période précédente (M-1)
    const previousStart = startOfMonth(subMonths(period.dateDebut, 1));
    const previousEnd = endOfMonth(subMonths(period.dateDebut, 1));
    
    const { data: previousData } = await supabase
      .from("kpi_values")
      .select("valeur")
      .eq("kpi_id", kpiId)
      .gte("periode_debut", format(previousStart, "yyyy-MM-dd"))
      .lte("periode_debut", format(previousEnd, "yyyy-MM-dd"))
      .order("periode_debut", { ascending: false })
      .limit(1)
      .single();

    // Sparkline (12 derniers mois)
    const sparklineStart = startOfMonth(subMonths(new Date(), 11));
    const { data: sparklineData } = await supabase
      .from("kpi_values")
      .select("valeur, periode_debut")
      .eq("kpi_id", kpiId)
      .gte("periode_debut", format(sparklineStart, "yyyy-MM-dd"))
      .order("periode_debut", { ascending: true });

    // Cumul année en cours
    const yearStart = startOfYear(new Date());
    const { data: cumulCurrentYear } = await supabase
      .from("kpi_values")
      .select("valeur")
      .eq("kpi_id", kpiId)
      .gte("periode_debut", format(yearStart, "yyyy-MM-dd"))
      .lte("periode_debut", format(new Date(), "yyyy-MM-dd"));

    // Cumul année précédente (même période)
    const previousYearStart = startOfYear(subMonths(new Date(), 12));
    const previousYearEnd = subMonths(new Date(), 12);
    const { data: cumulPreviousYear } = await supabase
      .from("kpi_values")
      .select("valeur")
      .eq("kpi_id", kpiId)
      .gte("periode_debut", format(previousYearStart, "yyyy-MM-dd"))
      .lte("periode_debut", format(previousYearEnd, "yyyy-MM-dd"));

    // Objectif
    const { data: objectifData } = await supabase
      .from("kpi_objectifs")
      .select("valeur_objectif")
      .eq("kpi_id", kpiId)
      .lte("periode_debut", format(period.dateDebut, "yyyy-MM-dd"))
      .or(`periode_fin.is.null,periode_fin.gte.${format(period.dateFin, "yyyy-MM-dd")}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return {
      currentValue: currentData?.valeur || 0,
      previousValue: previousData?.valeur || 0,
      sparklineData: generateSparklineData(
        (sparklineData || []).map(d => ({ date: d.periode_debut, valeur: d.valeur }))
      ),
      cumulYearCurrent: cumulCurrentYear?.reduce((sum, v) => sum + (v.valeur || 0), 0) || 0,
      cumulYearPrevious: cumulPreviousYear?.reduce((sum, v) => sum + (v.valeur || 0), 0) || 0,
      objectif: objectifData?.valeur_objectif,
    };
  };

  // Calculs automatiques
  const ecartTresorerie = caEncaisse && depenses
    ? calculateTresorerieEcart(caEncaisse.currentValue, depenses.currentValue)
    : 0;

  const decalage = caFacture && caEncaisse
    ? calculateDecalage(caFacture.currentValue, caEncaisse.currentValue)
    : { montant: 0, pourcentage: 0 };

  return (
    <div className="space-y-6">
      {/* Filtre de période */}
      <KPIPeriodFilter value={period} onChange={setPeriod} />

      {/* Grille des 4 KPI principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          kpiName="CA Facturé"
          currentValue={caFacture?.currentValue || 0}
          previousValue={caFacture?.previousValue}
          sparklineData={caFacture?.sparklineData}
          unit="currency"
          cumulYearCurrent={caFacture?.cumulYearCurrent}
          cumulYearPrevious={caFacture?.cumulYearPrevious}
          objectif={caFacture?.objectif}
          loading={loading}
          colorScheme="blue"
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
        />

        <KPICard
          kpiName="CA Encaissé"
          currentValue={caEncaisse?.currentValue || 0}
          previousValue={caEncaisse?.previousValue}
          sparklineData={caEncaisse?.sparklineData}
          unit="currency"
          cumulYearCurrent={caEncaisse?.cumulYearCurrent}
          cumulYearPrevious={caEncaisse?.cumulYearPrevious}
          objectif={caEncaisse?.objectif}
          loading={loading}
          colorScheme="green"
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
        />

        <KPICard
          kpiName="Dépenses"
          currentValue={depenses?.currentValue || 0}
          previousValue={depenses?.previousValue}
          sparklineData={depenses?.sparklineData}
          unit="currency"
          cumulYearCurrent={depenses?.cumulYearCurrent}
          cumulYearPrevious={depenses?.cumulYearPrevious}
          objectif={depenses?.objectif}
          loading={loading}
          colorScheme="orange"
          icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
        />

        <KPICard
          kpiName="Écart Trésorerie"
          currentValue={ecartTresorerie}
          previousValue={
            caEncaisse && depenses
              ? calculateTresorerieEcart(caEncaisse.previousValue, depenses.previousValue)
              : undefined
          }
          unit="currency"
          loading={loading}
          isCalculated
          colorScheme="dynamic"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      {/* Widget Décalage Facturé/Encaissé */}
      {caFacture && caEncaisse && (
        <Card className="border-l-4 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              Décalage Facturé / Encaissé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                  }).format(decalage.montant)}
                </div>
                <div className="text-sm text-muted-foreground">
                  En attente d'encaissement
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-yellow-600">
                  {decalage.pourcentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  du CA facturé
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
