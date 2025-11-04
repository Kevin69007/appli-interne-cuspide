import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SaisiePointageDialog } from "./SaisiePointageDialog";
import { ImportPointageDialog } from "./ImportPointageDialog";
import { Input } from "@/components/ui/input";

interface PointageData {
  id: string;
  date: string;
  heures: number;
  taux_activite: number | null;
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
  const [pointages, setPointages] = useState<PointageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaisieDialog, setShowSaisieDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
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
              <TableHead>Saisi par</TableHead>
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
                  <TableCell>{pointage.heures}h</TableCell>
                  <TableCell>
                    {pointage.taux_activite !== null ? `${pointage.taux_activite}%` : "-"}
                  </TableCell>
                  <TableCell>
                    {pointage.saisi_par
                      ? `${pointage.saisi_par.prenom} ${pointage.saisi_par.nom}`
                      : "-"}
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
    </div>
  );
};
