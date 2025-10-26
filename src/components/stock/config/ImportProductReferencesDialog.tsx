import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, X } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface ImportProductReferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductRow {
  code_reference: string;
  nom: string;
  fournisseur: string;
  categorie?: string;
  conditionnement?: string;
  quantite_min?: number;
  prix_unitaire?: number;
  seuil_alerte?: number;
  valid: boolean;
  errors: string[];
}

export const ImportProductReferencesDialog = ({ open, onOpenChange }: ImportProductReferencesDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ProductRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const importProducts = useMutation({
    mutationFn: async (validRows: ProductRow[]) => {
      const products = validRows.map((row) => {
        const supplier = suppliers?.find(
          (s) => s.name.toLowerCase() === row.fournisseur.toLowerCase()
        );
        const category = row.categorie
          ? categories?.find((c) => c.name.toLowerCase() === row.categorie?.toLowerCase())
          : null;

        return {
          reference_code: row.code_reference,
          name: row.nom,
          supplier_id: supplier!.id,
          category_id: category?.id || null,
          packaging: row.conditionnement || null,
          minimum_order_quantity: row.quantite_min || 1,
          unit_price: row.prix_unitaire || null,
          alert_threshold: row.seuil_alerte || 0,
        };
      });

      const { error } = await supabase.from("product_references").insert(products);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `✅ ${parsedData.filter((r) => r.valid).length} références importées` });
      queryClient.invalidateQueries({ queryKey: ["product-references"] });
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

  const validateRow = (row: any): ProductRow => {
    const errors: string[] = [];
    const code_reference = row.code_reference?.trim();
    const nom = row.nom?.trim();
    const fournisseur = row.fournisseur?.trim();
    const categorie = row.categorie?.trim();

    if (!code_reference) errors.push("Code référence manquant");
    if (!nom) errors.push("Nom manquant");
    if (!fournisseur) errors.push("Fournisseur manquant");

    if (fournisseur && suppliers) {
      const found = suppliers.find((s) => s.name.toLowerCase() === fournisseur.toLowerCase());
      if (!found) errors.push(`Fournisseur "${fournisseur}" introuvable`);
    }

    if (categorie && categories) {
      const found = categories.find((c) => c.name.toLowerCase() === categorie.toLowerCase());
      if (!found) errors.push(`Catégorie "${categorie}" introuvable`);
    }

    const quantite_min = row.quantite_min ? parseInt(row.quantite_min) : 1;
    const prix_unitaire = row.prix_unitaire ? parseFloat(row.prix_unitaire) : undefined;
    const seuil_alerte = row.seuil_alerte ? parseInt(row.seuil_alerte) : 0;

    if (row.quantite_min && isNaN(quantite_min)) errors.push("Quantité min invalide");
    if (row.prix_unitaire && isNaN(prix_unitaire!)) errors.push("Prix unitaire invalide");
    if (row.seuil_alerte && isNaN(seuil_alerte)) errors.push("Seuil d'alerte invalide");

    return {
      code_reference: code_reference || "",
      nom: nom || "",
      fournisseur: fournisseur || "",
      categorie: categorie || "",
      conditionnement: row.conditionnement?.trim() || "",
      quantite_min,
      prix_unitaire,
      seuil_alerte,
      valid: errors.length === 0,
      errors,
    };
  };

  const downloadTemplate = () => {
    const template = [
      {
        code_reference: "REF-001",
        nom: "Câble électrique 2.5mm",
        fournisseur: "Fournisseur A",
        categorie: "Électricité",
        conditionnement: "Rouleau de 100m",
        quantite_min: 1,
        prix_unitaire: 45.5,
        seuil_alerte: 10,
      },
      {
        code_reference: "REF-002",
        nom: "Disjoncteur 16A",
        fournisseur: "Fournisseur A",
        categorie: "Électricité",
        conditionnement: "Unité",
        quantite_min: 5,
        prix_unitaire: 12.3,
        seuil_alerte: 20,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Références");
    XLSX.writeFile(wb, "modele_references.xlsx");
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
  };

  const validCount = parsedData.filter((r) => r.valid).length;
  const errorCount = parsedData.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import de références produits</DialogTitle>
          <DialogDescription>
            Importez plusieurs références depuis un fichier CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger le modèle
            </Button>
            <label htmlFor="file-upload-prod">
              <Button variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Choisir un fichier
                </span>
              </Button>
            </label>
            <input
              id="file-upload-prod"
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
                        <th className="p-2 text-left">Code</th>
                        <th className="p-2 text-left">Nom</th>
                        <th className="p-2 text-left">Fournisseur</th>
                        <th className="p-2 text-left">Catégorie</th>
                        <th className="p-2 text-left">Prix</th>
                        <th className="p-2 text-left">Erreurs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className={row.valid ? "" : "bg-red-50"}>
                          <td className="p-2">{row.valid ? "✅" : "❌"}</td>
                          <td className="p-2">{row.code_reference}</td>
                          <td className="p-2">{row.nom}</td>
                          <td className="p-2">{row.fournisseur}</td>
                          <td className="p-2">{row.categorie}</td>
                          <td className="p-2">{row.prix_unitaire?.toFixed(2) || "-"}</td>
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
                  onClick={() => importProducts.mutate(parsedData.filter((r) => r.valid))}
                  disabled={validCount === 0 || importProducts.isPending}
                >
                  Importer {validCount} référence{validCount > 1 ? "s" : ""}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
