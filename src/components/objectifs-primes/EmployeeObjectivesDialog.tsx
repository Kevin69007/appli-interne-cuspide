import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target } from "lucide-react";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

export const EmployeeObjectivesDialog = () => {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [objectives, setObjectives] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    objectif_production: 0,
    objectif_qualite: 0,
    objectif_temps: 0
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from("agenda_entries")
        .insert([{
          employee_id: selectedEmployee,
          date: new Date(objectives.annee, objectives.mois - 1, 1).toISOString().split('T')[0],
          categorie: 'objectifs' as any,
          detail: `Production: ${objectives.objectif_production}, Qualité: ${objectives.objectif_qualite}, Temps: ${objectives.objectif_temps}`,
          statut_validation: 'en_attente'
        }]);

      if (error) throw error;

      toast.success("Les objectifs ont été enregistrés avec succès.");

      setSelectedEmployee("");
      setOpen(false);
    } catch (error) {
      console.error("Error setting objectives:", error);
      toast.error("Impossible de définir les objectifs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Target className="h-4 w-4 mr-2" />
          Définir objectifs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Définir les objectifs par employé</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Employé</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mois">Mois</Label>
              <Select 
                value={objectives.mois.toString()} 
                onValueChange={(v) => setObjectives({ ...objectives, mois: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                type="number"
                value={objectives.annee}
                onChange={(e) => setObjectives({ ...objectives, annee: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="production">Objectif Production</Label>
            <Input
              id="production"
              type="number"
              value={objectives.objectif_production}
              onChange={(e) => setObjectives({ ...objectives, objectif_production: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="qualite">Objectif Qualité (%)</Label>
            <Input
              id="qualite"
              type="number"
              value={objectives.objectif_qualite}
              onChange={(e) => setObjectives({ ...objectives, objectif_qualite: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="temps">Objectif Temps (min)</Label>
            <Input
              id="temps"
              type="number"
              value={objectives.objectif_temps}
              onChange={(e) => setObjectives({ ...objectives, objectif_temps: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !selectedEmployee}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
