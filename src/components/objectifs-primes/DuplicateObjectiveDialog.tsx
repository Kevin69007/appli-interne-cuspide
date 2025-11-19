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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

interface DuplicateObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: ObjectiveGroup;
  onSuccess: () => void;
}

const MONTHS = [
  { value: 0, label: "Janvier" },
  { value: 1, label: "Février" },
  { value: 2, label: "Mars" },
  { value: 3, label: "Avril" },
  { value: 4, label: "Mai" },
  { value: 5, label: "Juin" },
  { value: 6, label: "Juillet" },
  { value: 7, label: "Août" },
  { value: 8, label: "Septembre" },
  { value: 9, label: "Octobre" },
  { value: 10, label: "Novembre" },
  { value: 11, label: "Décembre" },
];

export const DuplicateObjectiveDialog = ({
  open,
  onOpenChange,
  objective,
  onSuccess,
}: DuplicateObjectiveDialogProps) => {
  const { t } = useTranslation('indicators');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [keepSameValues, setKeepSameValues] = useState(true);
  const [formData, setFormData] = useState({
    target_value: 0,
    points: 0,
  });
  const [previewCount, setPreviewCount] = useState(0);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    if (objective) {
      setFormData({
        target_value: objective.target_value,
        points: objective.points,
      });
    }
  }, [objective]);

  useEffect(() => {
    calculatePreview();
  }, [selectedMonths, selectedYears, objective]);

  const calculatePreview = () => {
    if (selectedMonths.length === 0 || selectedYears.length === 0) {
      setPreviewCount(0);
      return;
    }

    let count = 0;
    selectedYears.forEach(year => {
      selectedMonths.forEach(month => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        if (objective.recurrence === "jour") {
          count += daysInMonth;
        } else if (objective.recurrence === "semaine") {
          count += Math.ceil(daysInMonth / 7);
        } else {
          count += 1;
        }
      });
    });

    setPreviewCount(count);
  };

  const generateRecurringDates = (year: number, month: number, recurrence: string): string[] => {
    const dates: string[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (recurrence === "jour") {
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month, day).toISOString().split("T")[0]);
      }
    } else if (recurrence === "semaine") {
      for (let day = 1; day <= daysInMonth; day += 7) {
        dates.push(new Date(year, month, day).toISOString().split("T")[0]);
      }
    } else {
      dates.push(new Date(year, month, 1).toISOString().split("T")[0]);
    }

    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMonths.length === 0 || selectedYears.length === 0) {
      toast.error("Veuillez sélectionner au moins un mois et une année");
      return;
    }

    setLoading(true);

    try {
      const detail = {
        nom: objective.indicator_name,
        valeur_cible: keepSameValues ? objective.target_value : formData.target_value,
        unite: objective.unit,
        recurrence: objective.recurrence,
      };

      const entries: any[] = [];

      selectedYears.forEach(year => {
        selectedMonths.forEach(month => {
          const dates = generateRecurringDates(year, month, objective.recurrence);
          
          dates.forEach(date => {
            entries.push({
              employee_id: objective.employee_id,
              date,
              categorie: "objectif",
              type: objective.indicator_name,
              detail: JSON.stringify(detail),
              points_indicateur: keepSameValues ? objective.points : formData.points,
              statut_objectif: "en_attente",
              statut_validation: "valide",
              auteur_id: user?.id,
            });
          });
        });
      });

      const { error: insertError } = await supabase
        .from("agenda_entries")
        .insert(entries);

      if (insertError) throw insertError;

      // Log audit
      await supabase.from("audit_log").insert({
        table_name: "agenda_entries",
        action: "INSERT",
        user_id: user?.id,
        nouveau_contenu: {
          duplication_source: objective.entry_ids[0],
          entries_created: entries.length,
          months: selectedMonths,
          years: selectedYears,
        },
      });

      toast.success(t("management.duplicationSuccess"));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error duplicating objective:", error);
      toast.error("Erreur lors de la prolongation");
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (month: number) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("management.duplicateObjective")}</DialogTitle>
          <DialogDescription>
            Prolonger l'indicateur "{objective.indicator_name}" pour {objective.employee_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="text-sm font-medium">Période source</div>
              <div className="text-sm text-muted-foreground">
                {new Date(objective.period_start).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} → {new Date(objective.period_end).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </div>
              <div className="flex gap-2 mt-2">
                <Badge>{objective.target_value} {objective.unit}</Badge>
                <Badge>{objective.points} points</Badge>
                <Badge variant="outline">{objective.recurrence}</Badge>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("management.selectMonths")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map(month => (
                  <Button
                    key={month.value}
                    type="button"
                    variant={selectedMonths.includes(month.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMonth(month.value)}
                    className="justify-start"
                  >
                    {month.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("management.selectYears")}</Label>
              <div className="flex gap-2">
                {years.map(year => (
                  <Button
                    key={year}
                    type="button"
                    variant={selectedYears.includes(year) ? "default" : "outline"}
                    onClick={() => toggleYear(year)}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="keepSameValues"
              checked={keepSameValues}
              onCheckedChange={(checked) => setKeepSameValues(checked as boolean)}
            />
            <Label htmlFor="keepSameValues" className="cursor-pointer">
              {t("management.keepSameValues")}
            </Label>
          </div>

          {!keepSameValues && (
            <div className="grid grid-cols-2 gap-4">
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
          )}

          {previewCount > 0 && (
            <Card className="p-4 bg-primary/10">
              <div className="text-sm font-medium">
                {t("management.previewOccurrences", { count: previewCount })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total de points: {previewCount * (keepSameValues ? objective.points : formData.points)}
              </div>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || previewCount === 0}>
              {loading ? "Création..." : t("management.confirmDuplication")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
