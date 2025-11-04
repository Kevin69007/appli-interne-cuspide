import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CreateObjectifDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface KPI {
  id: string;
  nom: string;
  type_donnee: string;
}

export const CreateObjectifDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateObjectifDialogProps) => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedKPI, setSelectedKPI] = useState("");
  const [valeurObjectif, setValeurObjectif] = useState("");
  const [typePeriode, setTypePeriode] = useState<"monthly" | "yearly" | "weekly">("monthly");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    if (open) {
      fetchKPIs();
      resetForm();
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
      console.error("Error fetching KPIs:", error);
      toast.error("Erreur lors du chargement des KPI");
    }
  };

  const resetForm = () => {
    setSelectedKPI("");
    setValeurObjectif("");
    setTypePeriode("monthly");
    setDateDebut("");
    setDateFin("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKPI || !valeurObjectif || !dateDebut) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);

      // Get employee_id for current user
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const { error } = await supabase.from("kpi_objectifs").insert({
        kpi_id: selectedKPI,
        valeur_objectif: parseFloat(valeurObjectif),
        type_periode: typePeriode,
        periode_debut: dateDebut,
        periode_fin: dateFin || null,
        created_by: employeeData?.id || null,
      });

      if (error) throw error;

      toast.success("Objectif créé avec succès");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating objectif:", error);
      toast.error("Erreur lors de la création de l'objectif");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Définir un objectif KPI</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kpi">KPI *</Label>
            <Select value={selectedKPI} onValueChange={setSelectedKPI}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un KPI" />
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
            <Label htmlFor="valeur">Valeur objectif *</Label>
            <Input
              id="valeur"
              type="number"
              step="0.01"
              value={valeurObjectif}
              onChange={(e) => setValeurObjectif(e.target.value)}
              placeholder="Ex: 100000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de période *</Label>
            <Select value={typePeriode} onValueChange={(value: any) => setTypePeriode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date début *</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer l'objectif"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
