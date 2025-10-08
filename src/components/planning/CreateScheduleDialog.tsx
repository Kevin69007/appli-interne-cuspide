import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  equipe: string | null;
}

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onScheduleCreated?: () => void;
}

export const CreateScheduleDialog = ({
  open,
  onOpenChange,
  selectedDate,
  onScheduleCreated,
}: CreateScheduleDialogProps) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("17:00");
  const [pauseMinutes, setPauseMinutes] = useState(60);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, nom, prenom, equipe")
      .order("nom");

    if (!error && data) {
      setEmployees(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || selectedEmployees.length === 0 || !user) {
      toast.error("Veuillez sélectionner au moins un employé");
      return;
    }

    setLoading(true);

    try {
      const schedules = selectedEmployees.map((employeeId) => ({
        employee_id: employeeId,
        date: selectedDate.toISOString().split("T")[0],
        heure_debut: heureDebut,
        heure_fin: heureFin,
        pause_minutes: pauseMinutes,
        commentaire: commentaire || null,
        created_by: user.id,
      }));

      const { error } = await supabase.from("work_schedules").insert(schedules);

      if (error) throw error;

      toast.success(`Planning créé pour ${selectedEmployees.length} employé(s)`);
      onScheduleCreated?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating schedules:", error);
      toast.error("Erreur lors de la création du planning");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployees([]);
    setHeureDebut("09:00");
    setHeureFin("17:00");
    setPauseMinutes(60);
    setCommentaire("");
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const groupedEmployees = employees.reduce((acc, emp) => {
    const team = emp.equipe || "Sans équipe";
    if (!acc[team]) acc[team] = [];
    acc[team].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Créer un planning
            {selectedDate && ` - ${selectedDate.toLocaleDateString("fr-FR")}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Sélectionner les employés ({selectedEmployees.length})</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-4">
              {Object.entries(groupedEmployees).map(([team, teamEmployees]) => (
                <div key={team} className="space-y-2">
                  <h4 className="font-semibold text-sm">{team}</h4>
                  {teamEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center space-x-2 ml-4">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleEmployeeToggle(employee.id)}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {employee.prenom} {employee.nom}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heureDebut">Heure de début</Label>
              <Input
                id="heureDebut"
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heureFin">Heure de fin</Label>
              <Input
                id="heureFin"
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pause">Pause (minutes)</Label>
            <Input
              id="pause"
              type="number"
              min="0"
              value={pauseMinutes}
              onChange={(e) => setPauseMinutes(parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Informations supplémentaires..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || selectedEmployees.length === 0}>
              {loading ? "Création..." : "Créer le planning"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
