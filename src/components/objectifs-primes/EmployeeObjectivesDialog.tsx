import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, X } from "lucide-react";
import { CreateObjectiveDialog } from "./CreateObjectiveDialog";

// Fonction helper pour générer les dates selon la récurrence
const generateRecurringDates = (year: number, month: number, recurrence: "jour" | "semaine" | "mois"): string[] => {
  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  if (recurrence === "jour") {
    // Chaque jour du mois
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month - 1, day).toISOString().split('T')[0]);
    }
  } else if (recurrence === "semaine") {
    // Chaque vendredi du mois (jour 5 de la semaine, 0 = dimanche)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === 5) { // Vendredi
        dates.push(date.toISOString().split('T')[0]);
      }
    }
  } else if (recurrence === "mois") {
    // Dernier jour du mois
    dates.push(new Date(year, month - 1, daysInMonth).toISOString().split('T')[0]);
  }
  
  return dates;
};

interface Employee {
  id: string;
  nom: string;
  prenom: string;
}

interface Objective {
  nom: string;
  valeur_cible: number;
  indicateur: string;
  recurrence: "jour" | "semaine" | "mois";
  points_objectif: number;
}

export const EmployeeObjectivesDialog = () => {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth() + 1]);
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [totalPointsConfig, setTotalPointsConfig] = useState(100);

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchTotalPointsConfig();
    }
  }, [open]);

  const fetchTotalPointsConfig = async () => {
    const { data } = await supabase
      .from('configuration')
      .select('valeur')
      .eq('cle', 'objectifs_points_total')
      .single();

    if (data?.valeur && typeof data.valeur === 'number') {
      setTotalPointsConfig(data.valeur);
    }
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom")
      .order("nom");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleMonthToggle = (month: number) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const handleYearToggle = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleAddObjective = (objective: Objective) => {
    setObjectives([...objectives, objective]);
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const getTotalPoints = () => {
    return objectives.reduce((sum, obj) => sum + obj.points_objectif, 0);
  };

  const getPointsRemaining = () => {
    return totalPointsConfig - getTotalPoints();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      toast.error("Veuillez sélectionner au moins un employé");
      return;
    }
    if (selectedMonths.length === 0) {
      toast.error("Veuillez sélectionner au moins un mois");
      return;
    }
    if (selectedYears.length === 0) {
      toast.error("Veuillez sélectionner au moins une année");
      return;
    }
    if (objectives.length === 0) {
      toast.error("Veuillez créer au moins un objectif");
      return;
    }
    
    setLoading(true);

    try {
      // Générer les dates selon la récurrence de chaque objectif
      const entries = [];
      
      for (const employeeId of selectedEmployees) {
        for (const year of selectedYears) {
          for (const month of selectedMonths) {
            for (const objective of objectives) {
              const dates = generateRecurringDates(year, month, objective.recurrence);
              
              for (const date of dates) {
                entries.push({
                  employee_id: employeeId,
                  date: date,
                  categorie: 'objectifs' as const,
                  detail: JSON.stringify([objective]),
                  statut_validation: 'en_attente' as const
                });
              }
            }
          }
        }
      }

      const { error } = await supabase
        .from("agenda_entries")
        .insert(entries);

      if (error) throw error;

      toast.success(`${entries.length} objectif(s) ont été créés avec succès.`);

      setSelectedEmployees([]);
      setSelectedMonths([new Date().getMonth() + 1]);
      setSelectedYears([new Date().getFullYear()]);
      setObjectives([]);
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Définir les objectifs</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Mois (sélection multiple)</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthNum = i + 1;
                  return (
                    <div key={monthNum} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${monthNum}`}
                        checked={selectedMonths.includes(monthNum)}
                        onCheckedChange={() => handleMonthToggle(monthNum)}
                      />
                      <Label htmlFor={`month-${monthNum}`} className="cursor-pointer font-normal">
                        {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Années (sélection multiple)</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox
                        id={`year-${year}`}
                        checked={selectedYears.includes(year)}
                        onCheckedChange={() => handleYearToggle(year)}
                      />
                      <Label htmlFor={`year-${year}`} className="cursor-pointer font-normal">
                        {year}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label>Employés (sélection multiple)</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={emp.id}
                    checked={selectedEmployees.includes(emp.id)}
                    onCheckedChange={() => handleEmployeeToggle(emp.id)}
                  />
                  <Label htmlFor={emp.id} className="cursor-pointer font-normal">
                    {emp.prenom} {emp.nom}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Objectifs</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Total: <strong>{getTotalPoints()}</strong> / {totalPointsConfig} pts
                  {getPointsRemaining() < 0 && (
                    <span className="text-destructive ml-2">
                      (Dépassement de {Math.abs(getPointsRemaining())} pts)
                    </span>
                  )}
                  {getPointsRemaining() > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({getPointsRemaining()} pts restants)
                    </span>
                  )}
                </p>
              </div>
              <CreateObjectiveDialog onObjectiveCreated={handleAddObjective} totalPointsConfig={totalPointsConfig} currentTotal={getTotalPoints()} />
            </div>
            
            {objectives.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                Aucun objectif défini. Cliquez sur "Créer objectif" pour commencer.
              </p>
            ) : (
              <div className="space-y-2">
                {objectives.map((obj, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium">{obj.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        Cible: {obj.valeur_cible} {obj.indicateur}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Récurrence: {obj.recurrence === "jour" ? "Quotidien" : obj.recurrence === "semaine" ? "Hebdomadaire (vendredi)" : "Mensuel"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {obj.points_objectif} pts
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveObjective(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || selectedEmployees.length === 0 || selectedMonths.length === 0 || selectedYears.length === 0 || objectives.length === 0 || getPointsRemaining() < 0}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
