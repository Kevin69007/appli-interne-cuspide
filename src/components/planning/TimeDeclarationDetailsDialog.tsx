import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Declaration {
  id: string;
  date: string;
  heures: number;
  taux_activite: number;
  justification_requise: boolean;
  raison_ecart: string | null;
  details_justification: any;
  ecart_totalement_justifie: boolean;
}

interface TimeDeclarationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaration: Declaration;
}

export const TimeDeclarationDetailsDialog = ({
  open,
  onOpenChange,
  declaration
}: TimeDeclarationDetailsDialogProps) => {
  const { t } = useTranslation('planning');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('timeDeclaration.history.detailsTitle')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('timeDeclaration.date')}</p>
              <p className="font-medium">{format(new Date(declaration.date), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('timeDeclaration.history.hours')}</p>
              <p className="font-medium">{declaration.heures}h</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('timeDeclaration.history.activity')}</p>
              <p className="font-medium">{declaration.taux_activite}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('timeDeclaration.history.status')}</p>
              {declaration.justification_requise ? (
                <Badge variant={declaration.ecart_totalement_justifie ? "secondary" : "destructive"}>
                  {declaration.ecart_totalement_justifie 
                    ? t('timeDeclaration.history.justified')
                    : t('timeDeclaration.history.notJustified')}
                </Badge>
              ) : (
                <Badge variant="outline">OK</Badge>
              )}
            </div>
          </div>

          {declaration.justification_requise && declaration.raison_ecart && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">Justification</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Raison principale</p>
                    <p className="font-medium">
                      {t(`timeDeclaration.justification.reasons.${declaration.raison_ecart}`)}
                    </p>
                  </div>

                  {declaration.details_justification?.avec_qui && (
                    <div>
                      <p className="text-sm text-muted-foreground">Avec qui</p>
                      <p>{declaration.details_justification.avec_qui}</p>
                    </div>
                  )}

                  {declaration.details_justification?.heures_prevues && (
                    <div>
                      <p className="text-sm text-muted-foreground">Heures prévues</p>
                      <p>{declaration.details_justification.heures_prevues}h</p>
                    </div>
                  )}

                  {declaration.details_justification?.raisons_supplementaires?.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Raisons supplémentaires</p>
                      <ul className="list-disc list-inside space-y-1">
                        {declaration.details_justification.raisons_supplementaires.map((reason: any, index: number) => (
                          <li key={index} className="text-sm">
                            {t(`timeDeclaration.justification.reasons.${reason.type}`)}
                            {reason.details && ` - ${reason.details}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
