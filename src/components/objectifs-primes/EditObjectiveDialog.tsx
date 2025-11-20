import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ObjectiveGroup {
  employee_id: string;
  employee_name: string;
  indicator_name: string;
  recurrence: string;
  target_value: number;
  points: number;
  unit: string;
  period_start: string;
  period_end: string;
  total_occurrences: number;
  declared_occurrences: number;
  entry_ids: string[];
  statuses: string[];
}

interface EditObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: ObjectiveGroup;
  onSuccess: () => void;
}

export const EditObjectiveDialog = ({
  open,
  onOpenChange,
  objective,
  onSuccess,
}: EditObjectiveDialogProps) => {
  const { t } = useTranslation('indicators');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [modifyScope, setModifyScope] = useState<"future" | "all">("future");
  const [formData, setFormData] = useState({
    indicator_name: "",
    target_value: 0,
    unit: "",
    points: 0,
    recurrence: "mois",
  });

  useEffect(() => {
    if (objective) {
      setFormData({
        indicator_name: objective.indicator_name,
        target_value: objective.target_value,
        unit: objective.unit,
        points: objective.points,
        recurrence: objective.recurrence,
      });
    }
  }, [objective]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get entries to modify based on scope
      let entriesToModify = objective.entry_ids;
      
      if (modifyScope === "future") {
        const today = new Date().toISOString().split("T")[0];
        const { data: futureEntries } = await supabase
          .from("agenda_entries")
          .select("id")
          .in("id", objective.entry_ids)
          .gte("date", today);
        
        entriesToModify = futureEntries?.map(e => e.id) || [];
      }

      if (entriesToModify.length === 0) {
        toast.error("Aucune occurrence à modifier");
        setLoading(false);
        return;
      }

      // Calculer les points par occurrence (Option B : répartition)
      const pointsPerOccurrence = entriesToModify.length > 0 
        ? formData.points / entriesToModify.length 
        : 0;

      // Update entries
      const detail = [{
        nom: formData.indicator_name,
        valeur_cible: formData.target_value,
        unite: formData.unit,
        recurrence: formData.recurrence,
        points_indicateur: formData.points,
      }];

      const { error: updateError } = await supabase
        .from("agenda_entries")
        .update({
          type: formData.indicator_name,
          points_indicateur: pointsPerOccurrence,
          detail: JSON.stringify(detail),
        })
        .in("id", entriesToModify);

      if (updateError) throw updateError;

      // Log audit
      await supabase.from("audit_log").insert({
        table_name: "agenda_entries",
        action: "UPDATE",
        record_id: objective.entry_ids[0],
        user_id: user?.id,
        nouveau_contenu: {
          modification_type: modifyScope,
          entries_modified: entriesToModify.length,
          new_values: formData,
        },
      });

      toast.success(t("management.modificationSuccess"));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating objective:", error);
      toast.error("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("management.editObjective")}</DialogTitle>
          <DialogDescription>
            Modifier l'indicateur pour {objective.employee_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {objective.declared_occurrences > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t("management.warningModifyDeclared")} ({objective.declared_occurrences}/{objective.total_occurrences})
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Portée de la modification</Label>
            <RadioGroup value={modifyScope} onValueChange={(v: any) => setModifyScope(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="future" id="future" />
                <Label htmlFor="future" className="font-normal cursor-pointer">
                  {t("management.modifyFutureOnly")}
                  <span className="text-sm text-muted-foreground ml-2">
                    (Recommandé)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  {t("management.modifyAll")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="indicator_name">{t("management.indicatorName")}</Label>
              <Input
                id="indicator_name"
                value={formData.indicator_name}
                onChange={(e) => setFormData({ ...formData, indicator_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">{t("management.recurrence")}</Label>
              <Select
                value={formData.recurrence}
                onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
              >
                <SelectTrigger id="recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_value">{t("management.targetValue")}</Label>
              <Input
                id="target_value"
                type="number"
                step="0.01"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">{t("management.unit")}</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, h, unités..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">{t("management.points")}</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Modification..." : t("management.confirmModification")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
