import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, X } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ImportSuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SupplierRow {
  nom: string;
  email?: string;
  telephone?: string;
  responsable: string;
  notes?: string;
  valid: boolean;
  errors: string[];
}

export const ImportSuppliersDialog = ({ open, onOpenChange }: ImportSuppliersDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<SupplierRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ["employees-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nom, prenom")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const importSuppliers = useMutation({
    mutationFn: async (validRows: SupplierRow[]) => {
      const suppliers = validRows.map((row) => {
        const employee = employees?.find(
          (e) => `${e.prenom} ${e.nom}`.toLowerCase() === row.responsable.toLowerCase()
        );
        return {
          name: row.nom,
          contact_email: row.email || null,
          contact_phone: row.telephone || null,
          responsible_employee_id: employee!.id,
          notes: row.notes || null,
          auto_email_on_order: false,
        };
      });

      const { error } = await supabase.from("suppliers").insert(suppliers);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `✅ ${parsedData.filter((r) => r.valid).length} fournisseurs importés` });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      resetDialog();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur d'import",
        description: error.message,
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();
      let rows: any[] = [];

      if (fileExtension === "csv") {
        const text = await uploadedFile.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error("Format non supporté. Utilisez .csv, .xlsx ou .xls");
      }

      const validated = rows.map((row) => validateRow(row));
      setParsedData(validated);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de lecture",
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validateRow = (row: any): SupplierRow => {
    const errors: string[] = [];
    const nom = row.nom?.trim();
    const responsable = row.responsable?.trim();

    if (!nom) errors.push("Nom manquant");
    if (!responsable) errors.push("Responsable manquant");

    if (responsable && employees) {
      const found = employees.find(
        (e) => `${e.prenom} ${e.nom}`.toLowerCase() === responsable.toLowerCase()
      );
      if (!found) errors.push(`Responsable "${responsable}" introuvable`);
    }

    return {
      nom: nom || "",
      email: row.email?.trim() || "",
      telephone: row.telephone?.trim() || "",
      responsable: responsable || "",
      notes: row.notes?.trim() || "",
      valid: errors.length === 0,
      errors,
    };
  };

  const downloadTemplate = () => {
    const template = [
      { nom: "Fournisseur A", email: "contact@exemple.com", telephone: "0123456789", responsable: "Jean Dupont", notes: "Note exemple" },
      { nom: "Fournisseur B", email: "info@exemple.fr", telephone: "0198765432", responsable: "Marie Martin", notes: "" },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fournisseurs");
    XLSX.writeFile(wb, "modele_fournisseurs.xlsx");
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
  };

  const validCount = parsedData.filter((r) => r.valid).length;
  const errorCount = parsedData.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import de fournisseurs</DialogTitle>
          <DialogDescription>
            Importez plusieurs fournisseurs depuis un fichier CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger le modèle
            </Button>
            <label htmlFor="file-upload">
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Choisir un fichier
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {file.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {isProcessing && <p className="text-center text-muted-foreground">Traitement en cours...</p>}

          {parsedData.length > 0 && !isProcessing && (
            <>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{parsedData.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">✅ Valides</p>
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">❌ Erreurs</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">État</th>
                        <th className="p-2 text-left">Nom</th>
                        <th className="p-2 text-left">Responsable</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Erreurs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className={row.valid ? "" : "bg-red-50"}>
                          <td className="p-2">{row.valid ? "✅" : "❌"}</td>
                          <td className="p-2">{row.nom}</td>
                          <td className="p-2">{row.responsable}</td>
                          <td className="p-2">{row.email}</td>
                          <td className="p-2 text-red-600 text-xs">
                            {row.errors.join(", ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetDialog}>
                  Annuler
                </Button>
                <Button
                  onClick={() => importSuppliers.mutate(parsedData.filter((r) => r.valid))}
                  disabled={validCount === 0 || importSuppliers.isPending}
                >
                  Importer {validCount} fournisseur{validCount > 1 ? "s" : ""}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
