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
import { addDays, startOfDay, isBefore, isAfter, format } from "date-fns";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  equipe: string | null;
}

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleCreated?: () => void;
}

const JOURS_SEMAINE = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export const CreateScheduleDialog = ({
  open,
  onOpenChange,
  onScheduleCreated,
}: CreateScheduleDialogProps) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedJours, setSelectedJours] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Ven par défaut
  const [dateDebut, setDateDebut] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hasDateFin, setHasDateFin] = useState(false);
  const [dateFin, setDateFin] = useState("");
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
    if (selectedEmployees.length === 0 || selectedJours.length === 0 || !user) {
      toast.error("Veuillez sélectionner au moins un employé et un jour");
      return;
    }

    setLoading(true);

    try {
      const schedules = [];
      const scheduleGroupId = crypto.randomUUID(); // ID unique pour cette série
      const debut = startOfDay(new Date(dateDebut));
      // Si pas de date de fin, on prend 4 semaines par défaut pour couvrir tous les jours sélectionnés
      const fin = hasDateFin && dateFin 
        ? startOfDay(new Date(dateFin)) 
        : addDays(debut, 27); // 4 semaines

      // Générer toutes les dates entre début et fin
      let currentDate = debut;
      while (isBefore(currentDate, fin) || currentDate.getTime() === fin.getTime()) {
        const dayOfWeek = currentDate.getDay();
        
        // Si ce jour est sélectionné
        if (selectedJours.includes(dayOfWeek)) {
          // Créer un horaire pour chaque employé sélectionné
          selectedEmployees.forEach((employeeId) => {
            schedules.push({
              employee_id: employeeId,
              date: format(currentDate, "yyyy-MM-dd"),
              heure_debut: heureDebut,
              heure_fin: heureFin,
              pause_minutes: pauseMinutes,
              commentaire: commentaire || null,
              created_by: user.id,
              schedule_group_id: scheduleGroupId,
            });
          });
        }
        
        currentDate = addDays(currentDate, 1);
      }

      if (schedules.length === 0) {
        toast.error("Aucun planning à créer avec les jours sélectionnés");
        return;
      }

      const { error } = await supabase.from("work_schedules").insert(schedules);

      if (error) throw error;

      toast.success(`${schedules.length} horaire(s) créé(s) pour ${selectedEmployees.length} employé(s)`);
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
    setSelectedJours([1, 2, 3, 4, 5]);
    setDateDebut(format(new Date(), "yyyy-MM-dd"));
    setHasDateFin(false);
    setDateFin("");
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

  const handleJourToggle = (jour: number) => {
    setSelectedJours((prev) =>
      prev.includes(jour)
        ? prev.filter((j) => j !== jour)
        : [...prev, jour]
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
          <DialogTitle>Créer un planning</DialogTitle>
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

          <div className="space-y-4">
            <Label>Jours de la semaine ({selectedJours.length})</Label>
            <div className="flex flex-wrap gap-2">
              {JOURS_SEMAINE.map((jour) => (
                <div key={jour.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`jour-${jour.value}`}
                    checked={selectedJours.includes(jour.value)}
                    onCheckedChange={() => handleJourToggle(jour.value)}
                  />
                  <label
                    htmlFor={`jour-${jour.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {jour.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="hasDateFin"
                  checked={hasDateFin}
                  onCheckedChange={(checked) => setHasDateFin(checked === true)}
                />
                <Label htmlFor="hasDateFin" className="cursor-pointer">
                  Date de fin
                </Label>
              </div>
              {hasDateFin && (
                <Input
                  id="dateFin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  min={dateDebut}
                />
              )}
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
            <Button type="submit" disabled={loading || selectedEmployees.length === 0 || selectedJours.length === 0}>
              {loading ? "Création..." : "Créer le planning"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
