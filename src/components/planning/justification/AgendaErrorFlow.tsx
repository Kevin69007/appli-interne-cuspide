import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AgendaErrorFlowProps {
  onComplete: (data: any) => void;
}

export const AgendaErrorFlow = ({ onComplete }: AgendaErrorFlowProps) => {
  const { t } = useTranslation('planning');
  const [heuresPrevues, setHeuresPrevues] = useState('');

  const handleValidate = () => {
    onComplete({
      heures_prevues: parseFloat(heuresPrevues),
      couvreIntegralite: true
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="heures-prevues">{t('timeDeclaration.justification.agendaError.label')}</Label>
        <Input
          id="heures-prevues"
          type="number"
          step="0.5"
          min="0"
          max="24"
          placeholder={t('timeDeclaration.justification.agendaError.placeholder')}
          value={heuresPrevues}
          onChange={(e) => setHeuresPrevues(e.target.value)}
        />
      </div>
      <Button 
        onClick={handleValidate}
        disabled={!heuresPrevues}
        size="sm"
      >
        Valider
      </Button>
    </div>
  );
};
