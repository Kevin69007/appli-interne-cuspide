import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface SaisiePointageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

export const SaisiePointageDialog = ({ open, onOpenChange, onSuccess }: SaisiePointageDialogProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [heures, setHeures] = useState("");
  const [tauxActivite, setTauxActivite] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nom, prenom")
        .order("nom");
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des employés");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId || !date || !heures) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);
      
      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from("pointage")
        .upsert({
          employee_id: selectedEmployeeId,
          date,
          heures: parseFloat(heures),
          taux_activite: tauxActivite ? parseFloat(tauxActivite) : null,
          saisi_par: currentEmployee?.id
        }, {
          onConflict: "employee_id,date"
        });

      if (error) throw error;

      toast.success("Pointage enregistré avec succès");
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
    setSelectedEmployeeId("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setHeures("");
    setTauxActivite("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Saisie manuelle de pointage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employé *</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.prenom} {emp.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heures">Heures travaillées *</Label>
            <Input
              id="heures"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={heures}
              onChange={(e) => setHeures(e.target.value)}
              placeholder="Ex: 8.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taux">Taux d'activité (%)</Label>
            <Input
              id="taux"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={tauxActivite}
              onChange={(e) => setTauxActivite(e.target.value)}
              placeholder="Ex: 85.5"
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
