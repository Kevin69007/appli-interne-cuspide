import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkSchedule {
  id: string;
  employee_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  pause_minutes: number;
  commentaire: string | null;
  schedule_group_id: string | null;
  employees: {
    nom: string;
    prenom: string;
    equipe: string | null;
  };
}

interface EditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: WorkSchedule | null;
  onScheduleUpdated?: () => void;
}

export const EditScheduleDialog = ({
  open,
  onOpenChange,
  schedule,
  onScheduleUpdated,
}: EditScheduleDialogProps) => {
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [pauseMinutes, setPauseMinutes] = useState(60);
  const [commentaire, setCommentaire] = useState("");
  const [editMode, setEditMode] = useState<"single" | "series">("single");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schedule) {
      setHeureDebut(schedule.heure_debut.slice(0, 5));
      setHeureFin(schedule.heure_fin.slice(0, 5));
      setPauseMinutes(schedule.pause_minutes);
      setCommentaire(schedule.commentaire || "");
      setEditMode("single");
    }
  }, [schedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule) return;

    setLoading(true);

    try {
      const updateData = {
        heure_debut: heureDebut,
        heure_fin: heureFin,
        pause_minutes: pauseMinutes,
        commentaire: commentaire || null,
      };

      if (editMode === "single") {
        const { error } = await supabase
          .from("work_schedules")
          .update(updateData)
          .eq("id", schedule.id);

        if (error) throw error;
        toast.success("Horaire modifié");
      } else {
        if (!schedule.schedule_group_id) {
          toast.error("Cet horaire n'appartient à aucune série");
          return;
        }

        const { error } = await supabase
          .from("work_schedules")
          .update(updateData)
          .eq("schedule_group_id", schedule.schedule_group_id);

        if (error) throw error;
        toast.success("Toute la série a été modifiée");
      }

      onScheduleUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Modifier l'horaire de {schedule.employees.prenom} {schedule.employees.nom}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Date : {new Date(schedule.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
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
              onChange={(e) => setPauseMinutes(parseInt(e.target.value) || 0)}
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

          <div className="space-y-2">
            <Label>Appliquer les modifications à :</Label>
            <RadioGroup value={editMode} onValueChange={(v) => setEditMode(v as "single" | "series")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="edit-single" />
                <Label htmlFor="edit-single" className="cursor-pointer font-normal">
                  Uniquement cet horaire
                </Label>
              </div>
              {schedule.schedule_group_id && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="series" id="edit-series" />
                  <Label htmlFor="edit-series" className="cursor-pointer font-normal">
                    Toute la série récurrente
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
