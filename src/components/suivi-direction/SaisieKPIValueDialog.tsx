import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SaisieKPIValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface KPI {
  id: string;
  nom: string;
  type_donnee: string;
}

export const SaisieKPIValueDialog = ({ open, onOpenChange, onSuccess }: SaisieKPIValueDialogProps) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [selectedKpiId, setSelectedKpiId] = useState("");
  const [valeur, setValeur] = useState("");
  const [periodeDebut, setPeriodeDebut] = useState(format(new Date(), "yyyy-MM-dd"));
  const [periodeFin, setPeriodeFin] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchKPIs();
    }
  }, [open]);

  const fetchKPIs = async () => {
    try {
      const { data, error } = await supabase
        .from("kpi_definitions")
        .select("id, nom, type_donnee")
        .eq("is_active", true)
        .order("nom");
      
      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des KPI");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKpiId || !valeur || !periodeDebut) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", userData.user?.id)
        .single();

      const { error } = await supabase
        .from("kpi_values")
        .insert({
          kpi_id: selectedKpiId,
          valeur: parseFloat(valeur),
          periode_debut: periodeDebut,
          periode_fin: periodeFin || null,
          notes: notes || null,
          saisi_par: employeeData?.id
        });

      if (error) throw error;

      toast.success("Valeur enregistrée avec succès");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedKpiId("");
    setValeur("");
    setPeriodeDebut(format(new Date(), "yyyy-MM-dd"));
    setPeriodeFin("");
    setNotes("");
  };

  const getInputType = (typeDonnee: string) => {
    if (typeDonnee === "integer") return "number";
    return "number";
  };

  const getInputStep = (typeDonnee: string) => {
    if (typeDonnee === "integer") return "1";
    return "0.01";
  };

  const selectedKpi = kpis.find(k => k.id === selectedKpiId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saisir une valeur KPI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kpi">KPI *</Label>
            <Select value={selectedKpiId} onValueChange={setSelectedKpiId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un KPI" />
              </SelectTrigger>
              <SelectContent>
                {kpis.map((kpi) => (
                  <SelectItem key={kpi.id} value={kpi.id}>
                    {kpi.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valeur">Valeur *</Label>
            <Input
              id="valeur"
              type={selectedKpi ? getInputType(selectedKpi.type_donnee) : "number"}
              step={selectedKpi ? getInputStep(selectedKpi.type_donnee) : "0.01"}
              value={valeur}
              onChange={(e) => setValeur(e.target.value)}
              placeholder="Ex: 125000"
              required
            />
            {selectedKpi && selectedKpi.type_donnee === "currency" && (
              <p className="text-xs text-muted-foreground">Montant en euros</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debut">Date de début *</Label>
              <Input
                id="debut"
                type="date"
                value={periodeDebut}
                onChange={(e) => setPeriodeDebut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fin">Date de fin</Label>
              <Input
                id="fin"
                type="date"
                value={periodeFin}
                onChange={(e) => setPeriodeFin(e.target.value)}
                min={periodeDebut}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commentaires ou précisions..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
