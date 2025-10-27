import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PostponeTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    titre: string;
    date_echeance: string;
  };
  currentEmployeeId: string | null;
  onPostponementRequested: () => void;
}

export const PostponeTaskDialog = ({
  open,
  onOpenChange,
  task,
  currentEmployeeId,
  onPostponementRequested,
}: PostponeTaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nouvelle_date_proposee: "",
    raison_imprevue: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployeeId) {
      toast.error("Impossible de faire une demande de report");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("task_postponements").insert({
        task_id: task.id,
        demandeur_id: currentEmployeeId,
        raison_imprevue: formData.raison_imprevue,
        ancienne_date: task.date_echeance,
        nouvelle_date_proposee: formData.nouvelle_date_proposee,
        statut: "en_attente",
      });

      if (error) throw error;

      toast.success("Demande de report envoyée");
      onPostponementRequested();
      onOpenChange(false);
      setFormData({
        nouvelle_date_proposee: "",
        raison_imprevue: "",
      });
    } catch (error) {
      console.error("Error requesting postponement:", error);
      toast.error("Erreur lors de la demande de report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demander un report de tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Tâche :</strong> {task.titre}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Date actuelle :</strong>{" "}
              {format(new Date(task.date_echeance), "dd/MM/yyyy")}
            </p>
          </div>

          <div>
            <Label htmlFor="nouvelle_date">Nouvelle date proposée *</Label>
            <Input
              id="nouvelle_date"
              type="date"
              value={formData.nouvelle_date_proposee}
              onChange={(e) =>
                setFormData({ ...formData, nouvelle_date_proposee: e.target.value })
              }
              min={task.date_echeance}
              required
            />
          </div>

          <div>
            <Label htmlFor="raison">Raison de l'imprévu *</Label>
            <Textarea
              id="raison"
              value={formData.raison_imprevue}
              onChange={(e) =>
                setFormData({ ...formData, raison_imprevue: e.target.value })
              }
              placeholder="Décrivez la raison du report demandé..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Soumettre la demande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
