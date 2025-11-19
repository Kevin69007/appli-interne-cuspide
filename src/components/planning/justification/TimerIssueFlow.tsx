import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimerIssueFlowProps {
  onComplete: (data: any) => void;
  onAddReason: (reason: any) => void;
  missingHours: number;
}

export const TimerIssueFlow = ({ onComplete, onAddReason, missingHours }: TimerIssueFlowProps) => {
  const { t } = useTranslation('planning');
  const [couvreIntegralite, setCouvreIntegralite] = useState<string>('');
  const [additionalReason, setAdditionalReason] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  const handleValidate = () => {
    const data = {
      couvreIntegralite: couvreIntegralite === 'yes'
    };

    if (couvreIntegralite === 'yes') {
      onComplete(data);
    } else {
      setShowAdditional(true);
    }
  };

  const handleAddAdditional = () => {
    if (additionalReason) {
      onAddReason({
        type: additionalReason,
        details: ''
      });
      onComplete({
        couvreIntegralite: false
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('timeDeclaration.justification.timer.coverAll')}</Label>
        <RadioGroup value={couvreIntegralite} onValueChange={setCouvreIntegralite}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="timer-yes" />
            <Label htmlFor="timer-yes" className="font-normal cursor-pointer">
              {t('timeDeclaration.justification.timer.yes')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="timer-no" />
            <Label htmlFor="timer-no" className="font-normal cursor-pointer">
              {t('timeDeclaration.justification.timer.no')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {showAdditional && couvreIntegralite === 'no' && (
        <div className="space-y-2 border-t pt-4">
          <Label>{t('timeDeclaration.justification.additionalReasons')}</Label>
          <Select value={additionalReason} onValueChange={setAdditionalReason}>
            <SelectTrigger>
              <SelectValue placeholder={t('timeDeclaration.justification.selectReason')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reunions_appels">
                {t('timeDeclaration.justification.reasons.reunions_appels')}
              </SelectItem>
              <SelectItem value="personal_issue">
                {t('timeDeclaration.justification.reasons.personal_issue')}
              </SelectItem>
              <SelectItem value="no_work">
                {t('timeDeclaration.justification.reasons.no_work')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleAddAdditional}
            disabled={!additionalReason}
            size="sm"
          >
            {t('timeDeclaration.justification.addReason')}
          </Button>
        </div>
      )}

      {couvreIntegralite && !showAdditional && (
        <Button 
          onClick={handleValidate}
          disabled={!couvreIntegralite}
          size="sm"
        >
          Valider
        </Button>
      )}
    </div>
  );
};
