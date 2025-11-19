import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface PointageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pointage: {
    id: string;
    date: string;
    heures: number;
    taux_activite: number | null;
    justification_requise?: boolean;
    raison_ecart?: string | null;
    details_justification?: any;
    ecart_totalement_justifie?: boolean;
    employee: {
      nom: string;
      prenom: string;
    };
  } | null;
}

export const PointageDetailsDialog = ({ open, onOpenChange, pointage }: PointageDetailsDialogProps) => {
  const { t } = useTranslation('planning');

  if (!pointage) return null;

  const getHoursColor = (hours: number) => {
    if (hours >= 6.5) return 'text-green-600 dark:text-green-400';
    if (hours >= 6) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getActivityColor = (rate: number) => {
    if (rate > 70) return 'text-green-600 dark:text-green-400';
    if (rate >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('history.details')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('timeDeclaration.date')}</p>
              <p className="font-medium">
                {format(new Date(pointage.date), 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employé</p>
              <p className="font-medium">{pointage.employee.prenom} {pointage.employee.nom}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('timeDeclaration.hours')}</p>
              <p className={`text-2xl font-bold ${getHoursColor(pointage.heures)}`}>
                {pointage.heures}h
              </p>
            </div>
            {pointage.taux_activite !== null && (
              <div>
                <p className="text-sm text-muted-foreground">{t('timeDeclaration.activityRate')}</p>
                <p className={`text-2xl font-bold ${getActivityColor(pointage.taux_activite)}`}>
                  {pointage.taux_activite}%
                </p>
              </div>
            )}
          </div>

          {pointage.justification_requise && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">
                  {t('history.justificationRequired')}
                </Badge>
                {pointage.ecart_totalement_justifie && (
                  <Badge variant="default">
                    {t('history.fullyJustified')}
                  </Badge>
                )}
              </div>

              {pointage.raison_ecart && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('history.reason')}</p>
                  <p className="font-medium">{t(`timeDeclaration.justification.reasons.${pointage.raison_ecart}`)}</p>
                </div>
              )}

              {pointage.details_justification && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t('history.additionalDetails')}</p>
                  <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                    {Object.entries(pointage.details_justification).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}: </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};