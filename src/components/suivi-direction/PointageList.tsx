import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SaisiePointageDialog } from "./SaisiePointageDialog";
import { ImportPointageDialog } from "./ImportPointageDialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PointageDetailsDialog } from "./PointageDetailsDialog";
import { useTranslation } from "react-i18next";

interface PointageData {
  id: string;
  date: string;
  heures: number;
  taux_activite: number | null;
  justification_requise?: boolean;
  raison_ecart?: string | null;
  details_justification?: any;
  ecart_totalement_justifie?: boolean;
  employee: {
    id: string;
    nom: string;
    prenom: string;
  };
  saisi_par?: {
    nom: string;
    prenom: string;
  };
}

export const PointageList = () => {
  const { t } = useTranslation('planning');
  const [pointages, setPointages] = useState<PointageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaisieDialog, setShowSaisieDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedPointage, setSelectedPointage] = useState<PointageData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchPointages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pointage")
        .select(`
          id,
          date,
          heures,
          taux_activite,
          justification_requise,
          raison_ecart,
          details_justification,
          ecart_totalement_justifie,
          employee:employees!pointage_employee_id_fkey(id, nom, prenom),
          saisi_par:employees!pointage_saisi_par_fkey(nom, prenom)
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;
      setPointages(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des pointages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointages();
  }, [startDate, endDate]);

  const exportToPDF = () => {
    toast.info("Fonctionnalité d'export PDF en cours de développement");
  };

  const getHoursColor = (hours: number) => {
    if (hours >= 6.5) return 'text-green-600 dark:text-green-400';
    if (hours >= 6) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleViewDetails = (pointage: PointageData) => {
    setSelectedPointage(pointage);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <span>à</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importer Excel/CSV
          </Button>
          <Button onClick={() => setShowSaisieDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Saisie manuelle
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employé</TableHead>
              <TableHead>Heures</TableHead>
              <TableHead>Taux activité (%)</TableHead>
              <TableHead>Justification</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Saisi par</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : pointages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun pointage pour cette période
                </TableCell>
              </TableRow>
            ) : (
              pointages.map((pointage) => (
                <TableRow key={pointage.id}>
                  <TableCell>
                    {format(new Date(pointage.date), "dd MMMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {pointage.employee.prenom} {pointage.employee.nom}
                  </TableCell>
                  <TableCell className={getHoursColor(pointage.heures)}>
                    {pointage.heures}h
                  </TableCell>
                  <TableCell>
                    {pointage.taux_activite !== null ? `${pointage.taux_activite}%` : "-"}
                  </TableCell>
                  <TableCell>
                    {pointage.justification_requise ? (
                      <Badge variant="destructive" className="text-xs">
                        Oui
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Non
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {pointage.raison_ecart ? (
                      <span className="text-sm">
                        {t(`timeDeclaration.justification.reasons.${pointage.raison_ecart}`)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {pointage.saisi_par
                      ? `${pointage.saisi_par.prenom} ${pointage.saisi_par.nom}`
                      : "Auto"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(pointage)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SaisiePointageDialog
        open={showSaisieDialog}
        onOpenChange={setShowSaisieDialog}
        onSuccess={fetchPointages}
      />

      <ImportPointageDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={fetchPointages}
      />

      <PointageDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        pointage={selectedPointage}
      />
    </div>
  );
};
