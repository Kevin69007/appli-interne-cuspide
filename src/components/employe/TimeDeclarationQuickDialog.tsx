import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Info, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useEmployee } from "@/contexts/EmployeeContext";
import { useToast } from "@/hooks/use-toast";
import { JustificationSection } from "@/components/planning/JustificationSection";
import { fetchEmployeeWorkConfig } from "@/lib/leaveBalanceUtils";
import { cn } from "@/lib/utils";

interface TimeDeclarationQuickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSuccess: () => void;
}

export const TimeDeclarationQuickDialog = ({
  open,
  onOpenChange,
  date,
  onSuccess,
}: TimeDeclarationQuickDialogProps) => {
  const { employee } = useEmployee();
  const { toast } = useToast();

  const [heures, setHeures] = useState('');
  const [tauxActivite, setTauxActivite] = useState('');
  const [needsJustification, setNeedsJustification] = useState(false);
  const [justificationData, setJustificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dailyHoursBase, setDailyHoursBase] = useState(7);

  // Reset form when date changes
  useEffect(() => {
    setHeures('');
    setTauxActivite('');
    setJustificationData(null);
    setNeedsJustification(false);
  }, [date]);

  // Fetch work config
  useEffect(() => {
    const loadWorkConfig = async () => {
      if (!employee?.id) return;
      const workConfig = await fetchEmployeeWorkConfig(employee.id);
      setDailyHoursBase(workConfig.dailyHours);
    };
    loadWorkConfig();
  }, [employee?.id]);

  // Check if justification needed
  useEffect(() => {
    const hours = parseFloat(heures);
    setNeedsJustification(!isNaN(hours) && hours < dailyHoursBase);
  }, [heures, dailyHoursBase]);

  const greenThreshold = dailyHoursBase * 0.93;
  const orangeThreshold = dailyHoursBase * 0.86;

  const getHoursColor = (hours: number) => {
    if (hours >= greenThreshold) return 'border-green-500 bg-green-50 dark:bg-green-950';
    if (hours >= orangeThreshold) return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
    return 'border-red-500 bg-red-50 dark:bg-red-950';
  };

  const getActivityColor = (rate: number) => {
    if (rate > 70) return 'border-green-500 bg-green-50 dark:bg-green-950';
    if (rate >= 50) return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
    return 'border-red-500 bg-red-50 dark:bg-red-950';
  };

  const handleSubmit = async () => {
    if (!employee?.id) return;

    const hours = parseFloat(heures);
    const activity = parseFloat(tauxActivite);

    if (isNaN(hours) || isNaN(activity)) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs correctement"
      });
      return;
    }

    if (needsJustification && !justificationData) {
      toast({
        variant: "destructive",
        title: "Justification requise",
        description: "Veuillez justifier votre écart d'heures"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('pointage')
        .upsert({
          employee_id: employee.id,
          date,
          heures: hours,
          taux_activite: activity,
          justification_requise: needsJustification,
          raison_ecart: justificationData?.raison || null,
          details_justification: justificationData || {},
          ecart_totalement_justifie: justificationData?.complet || true,
        }, {
          onConflict: 'employee_id,date'
        });

      if (error) throw error;

      toast({
        title: "Heures déclarées",
        description: `${hours}h déclarées pour le ${format(new Date(date), 'dd/MM/yyyy')}`
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving declaration:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer la déclaration"
      });
    } finally {
      setLoading(false);
    }
  };

  const hours = parseFloat(heures);
  const activity = parseFloat(tauxActivite);
  const formattedDate = format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto max-sm:p-4">
        <DialogHeader>
          <DialogTitle className="capitalize text-base sm:text-lg">
            Déclaration du {formattedDate}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Base info */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 rounded-md px-2 sm:px-3 py-2">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>Base : {dailyHoursBase.toFixed(1)}h/jour</span>
          </div>

          {/* Hours input */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="heures" className="text-sm">Heures travaillées</Label>
            <Input
              id="heures"
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="Ex: 7.5"
              value={heures}
              onChange={(e) => setHeures(e.target.value)}
              className={cn(
                "border-2 transition-colors h-10 sm:h-11",
                !isNaN(hours) && hours > 0 && getHoursColor(hours)
              )}
            />
          </div>

          {/* Activity rate input */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="taux" className="text-sm">Taux d'activité (%)</Label>
            <Input
              id="taux"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="Ex: 80"
              value={tauxActivite}
              onChange={(e) => setTauxActivite(e.target.value)}
              className={cn(
                "border-2 transition-colors h-10 sm:h-11",
                !isNaN(activity) && activity > 0 && getActivityColor(activity)
              )}
            />
          </div>

          {/* Justification section */}
          {needsJustification && (
            <>
              <Alert variant="destructive" className="py-2 sm:py-3">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <AlertTitle className="text-sm">Justification requise</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  Vous devez justifier les heures manquantes ({(dailyHoursBase - hours).toFixed(1)}h)
                </AlertDescription>
              </Alert>
              <JustificationSection
                onDataChange={setJustificationData}
                missingHours={dailyHoursBase - hours}
              />
            </>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            className="w-full h-10 sm:h-11"
            disabled={loading || !heures || !tauxActivite || (needsJustification && !justificationData)}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
