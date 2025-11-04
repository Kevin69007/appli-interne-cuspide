import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportPointageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PointageRow {
  nom: string;
  prenom: string;
  date: string;
  heures: number;
  taux_activite?: number;
}

export const ImportPointageDialog = ({ open, onOpenChange, onSuccess }: ImportPointageDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileType !== "xlsx" && fileType !== "xls" && fileType !== "csv") {
        toast.error("Format de fichier non supporté. Utilisez Excel (.xlsx, .xls) ou CSV.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseExcelData = async (file: File): Promise<PointageRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          
          const pointages: PointageRow[] = jsonData.map((row: any) => ({
            nom: row["Nom"] || row["nom"] || "",
            prenom: row["Prénom"] || row["Prenom"] || row["prenom"] || "",
            date: row["Date"] || row["date"] || "",
            heures: parseFloat(row["Heures"] || row["heures"] || "0"),
            taux_activite: row["Taux activité"] || row["Taux"] || row["taux_activite"] 
              ? parseFloat(row["Taux activité"] || row["Taux"] || row["taux_activite"])
              : undefined
          }));
          
          resolve(pointages);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsBinaryString(file);
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      setLoading(true);
      
      const pointages = await parseExcelData(file);
      
      if (pointages.length === 0) {
        toast.error("Aucune donnée trouvée dans le fichier");
        return;
      }

      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data: employees } = await supabase
        .from("employees")
        .select("id, nom, prenom");

      if (!employees) {
        toast.error("Impossible de charger les employés");
        return;
      }

      const pointagesToInsert = [];
      const errors = [];

      for (const pointage of pointages) {
        const employee = employees.find(
          e => e.nom.toLowerCase() === pointage.nom.toLowerCase() && 
               e.prenom.toLowerCase() === pointage.prenom.toLowerCase()
        );

        if (!employee) {
          errors.push(`Employé non trouvé: ${pointage.prenom} ${pointage.nom}`);
          continue;
        }

        if (!pointage.date || isNaN(pointage.heures)) {
          errors.push(`Données invalides pour ${pointage.prenom} ${pointage.nom}`);
          continue;
        }

        pointagesToInsert.push({
          employee_id: employee.id,
          date: pointage.date,
          heures: pointage.heures,
          taux_activite: pointage.taux_activite || null,
          saisi_par: currentEmployee?.id
        });
      }

      if (pointagesToInsert.length === 0) {
        toast.error("Aucune donnée valide à importer");
        if (errors.length > 0) {
          console.error("Erreurs d'import:", errors);
        }
        return;
      }

      const { error } = await supabase
        .from("pointage")
        .upsert(pointagesToInsert, { onConflict: "employee_id,date" });

      if (error) throw error;

      toast.success(`${pointagesToInsert.length} pointages importés avec succès`);
      if (errors.length > 0) {
        toast.warning(`${errors.length} lignes ignorées (voir la console pour les détails)`);
        console.warn("Lignes ignorées:", errors);
      }
      
      onSuccess();
      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      toast.error("Erreur lors de l'import");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer des pointages</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">Format attendu:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Colonne "Nom" : Nom de l'employé</li>
              <li>Colonne "Prénom" : Prénom de l'employé</li>
              <li>Colonne "Date" : Date au format AAAA-MM-JJ</li>
              <li>Colonne "Heures" : Nombre d'heures travaillées</li>
              <li>Colonne "Taux activité" (optionnel) : Pourcentage</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Fichier Excel ou CSV</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              {loading ? "Import en cours..." : "Importer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
