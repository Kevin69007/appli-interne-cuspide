import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { JustificationSection } from "./JustificationSection";
import { cn } from "@/lib/utils";

interface TimeDeclarationFormProps {
  onSuccess?: () => void;
}

export const TimeDeclarationForm = ({ onSuccess }: TimeDeclarationFormProps) => {
  const { t } = useTranslation('planning');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [heures, setHeures] = useState('');
  const [tauxActivite, setTauxActivite] = useState('');
  const [needsJustification, setNeedsJustification] = useState(false);
  const [justificationData, setJustificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setEmployeeId(data.id);
    };
    fetchEmployeeId();
  }, [user]);

  useEffect(() => {
    const hours = parseFloat(heures);
    setNeedsJustification(!isNaN(hours) && hours < 7);
  }, [heures]);

  const getHoursColor = (hours: number) => {
    if (hours >= 6.5) return 'border-green-500 bg-green-50 dark:bg-green-950';
    if (hours >= 6) return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
    return 'border-red-500 bg-red-50 dark:bg-red-950';
  };

  const getActivityColor = (rate: number) => {
    if (rate > 70) return 'border-green-500 bg-green-50 dark:bg-green-950';
    if (rate >= 50) return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
    return 'border-red-500 bg-red-50 dark:bg-red-950';
  };

  const getHoursMessage = (hours: number) => {
    if (hours >= 6.5) return t('timeDeclaration.validation.greenZone');
    if (hours >= 6) return t('timeDeclaration.validation.orangeZone');
    return t('timeDeclaration.validation.redZone');
  };

  const getActivityMessage = (rate: number) => {
    if (rate > 70) return t('timeDeclaration.validation.activityGreen');
    if (rate >= 50) return t('timeDeclaration.validation.activityOrange');
    return t('timeDeclaration.validation.activityRed');
  };

  const handleSubmit = async () => {
    if (!employeeId) return;

    const hours = parseFloat(heures);
    const activity = parseFloat(tauxActivite);

    if (isNaN(hours) || isNaN(activity)) {
      toast({
        variant: "destructive",
        title: t('timeDeclaration.error'),
        description: "Veuillez remplir tous les champs correctement"
      });
      return;
    }

    if (needsJustification && !justificationData) {
      toast({
        variant: "destructive",
        title: t('timeDeclaration.error'),
        description: "Veuillez justifier votre écart d'heures"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('pointage')
        .upsert({
          employee_id: employeeId,
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
        title: t('timeDeclaration.success'),
        description: `${hours}h déclarées pour le ${format(new Date(date), 'dd/MM/yyyy')}`
      });

      // Reset form
      setHeures('');
      setTauxActivite('');
      setJustificationData(null);
      
      // Notify parent to refresh
      onSuccess?.();
    } catch (error) {
      console.error('Error saving declaration:', error);
      toast({
        variant: "destructive",
        title: t('timeDeclaration.error')
      });
    } finally {
      setLoading(false);
    }
  };

  const hours = parseFloat(heures);
  const activity = parseFloat(tauxActivite);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('timeDeclaration.title')}
        </CardTitle>
        <CardDescription>{t('timeDeclaration.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="date">{t('timeDeclaration.date')}</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="heures">{t('timeDeclaration.hours')}</Label>
          <Input
            id="heures"
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder={t('timeDeclaration.hoursPlaceholder')}
            value={heures}
            onChange={(e) => setHeures(e.target.value)}
            className={cn(
              "border-2 transition-colors",
              !isNaN(hours) && hours > 0 && getHoursColor(hours)
            )}
          />
          {!isNaN(hours) && hours > 0 && (
            <p className="text-sm font-medium">{getHoursMessage(hours)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taux">{t('timeDeclaration.activityRate')}</Label>
          <Input
            id="taux"
            type="number"
            step="1"
            min="0"
            max="100"
            placeholder={t('timeDeclaration.activityPlaceholder')}
            value={tauxActivite}
            onChange={(e) => setTauxActivite(e.target.value)}
            className={cn(
              "border-2 transition-colors",
              !isNaN(activity) && activity > 0 && getActivityColor(activity)
            )}
          />
          {!isNaN(activity) && activity > 0 && (
            <p className="text-sm font-medium">{getActivityMessage(activity)}</p>
          )}
        </div>

        {needsJustification && (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('timeDeclaration.justification.required')}</AlertTitle>
              <AlertDescription>
                Vous devez justifier les heures manquantes
              </AlertDescription>
            </Alert>
            <JustificationSection
              onDataChange={setJustificationData}
              missingHours={7 - hours}
            />
          </>
        )}

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={loading || !heures || !tauxActivite || (needsJustification && !justificationData)}
        >
          {t('timeDeclaration.submit')}
        </Button>
      </CardContent>
    </Card>
  );
};
