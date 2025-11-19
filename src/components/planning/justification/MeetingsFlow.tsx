import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MeetingsFlowProps {
  onComplete: (data: any) => void;
  onAddReason: (reason: any) => void;
  missingHours: number;
}

export const MeetingsFlow = ({ onComplete, onAddReason, missingHours }: MeetingsFlowProps) => {
  const { t } = useTranslation('planning');
  const [avecQui, setAvecQui] = useState('');
  const [couvreIntegralite, setCouvreIntegralite] = useState<string>('');
  const [additionalReason, setAdditionalReason] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  const handleValidate = () => {
    const data = {
      avec_qui: avecQui,
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
        avec_qui: avecQui,
        couvreIntegralite: false
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="avec-qui">{t('timeDeclaration.justification.meetings.withWho')}</Label>
        <Input
          id="avec-qui"
          placeholder={t('timeDeclaration.justification.meetings.withWhoPlaceholder')}
          value={avecQui}
          onChange={(e) => setAvecQui(e.target.value)}
        />
      </div>

      {avecQui && (
        <div className="space-y-2">
          <Label>{t('timeDeclaration.justification.meetings.coverAll')}</Label>
          <RadioGroup value={couvreIntegralite} onValueChange={setCouvreIntegralite}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="font-normal cursor-pointer">
                {t('timeDeclaration.justification.meetings.yes')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="font-normal cursor-pointer">
                {t('timeDeclaration.justification.meetings.no')}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {showAdditional && couvreIntegralite === 'no' && (
        <div className="space-y-2 border-t pt-4">
          <Label>{t('timeDeclaration.justification.additionalReasons')}</Label>
          <Select value={additionalReason} onValueChange={setAdditionalReason}>
            <SelectTrigger>
              <SelectValue placeholder={t('timeDeclaration.justification.selectReason')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timer_issue">
                {t('timeDeclaration.justification.reasons.timer_issue')}
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
          disabled={!avecQui || !couvreIntegralite}
          size="sm"
        >
          Valider
        </Button>
      )}
    </div>
  );
};
