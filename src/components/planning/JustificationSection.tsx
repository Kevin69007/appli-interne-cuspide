import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgendaErrorFlow } from "./justification/AgendaErrorFlow";
import { MeetingsFlow } from "./justification/MeetingsFlow";
import { TimerIssueFlow } from "./justification/TimerIssueFlow";
import { PersonalIssueFlow } from "./justification/PersonalIssueFlow";
import { NoWorkFlow } from "./justification/NoWorkFlow";

interface JustificationSectionProps {
  onDataChange: (data: any) => void;
  missingHours: number;
}

export const JustificationSection = ({ onDataChange, missingHours }: JustificationSectionProps) => {
  const { t } = useTranslation('planning');
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalReasons, setAdditionalReasons] = useState<any[]>([]);

  const handleReasonComplete = (data: any) => {
    const finalData = {
      raison: selectedReason,
      ...data,
      complet: data.couvreIntegralite !== false,
      raisons_supplementaires: additionalReasons
    };
    onDataChange(finalData);
  };

  const handleAddAdditionalReason = (reason: any) => {
    const newReasons = [...additionalReasons, reason];
    setAdditionalReasons(newReasons);
    
    // Update parent with additional reason
    onDataChange({
      raison: selectedReason,
      complet: false,
      raisons_supplementaires: newReasons
    });
  };

  const renderReasonFlow = () => {
    switch(selectedReason) {
      case 'agenda_error':
        return <AgendaErrorFlow onComplete={handleReasonComplete} />;
      case 'reunions_appels':
        return <MeetingsFlow onComplete={handleReasonComplete} onAddReason={handleAddAdditionalReason} missingHours={missingHours} />;
      case 'timer_issue':
        return <TimerIssueFlow onComplete={handleReasonComplete} onAddReason={handleAddAdditionalReason} missingHours={missingHours} />;
      case 'personal_issue':
        return <PersonalIssueFlow onComplete={handleReasonComplete} />;
      case 'no_work':
        return <NoWorkFlow onComplete={handleReasonComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="border-t pt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">{t('timeDeclaration.justification.selectReason')}</Label>
        <Select value={selectedReason} onValueChange={setSelectedReason}>
          <SelectTrigger id="reason">
            <SelectValue placeholder={t('timeDeclaration.justification.selectReason')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agenda_error">
              {t('timeDeclaration.justification.reasons.agenda_error')}
            </SelectItem>
            <SelectItem value="reunions_appels">
              {t('timeDeclaration.justification.reasons.reunions_appels')}
            </SelectItem>
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
      </div>

      {selectedReason && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          {renderReasonFlow()}
        </div>
      )}

      {additionalReasons.length > 0 && (
        <div className="bg-accent/50 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">{t('timeDeclaration.justification.additionalReasons')}</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {additionalReasons.map((reason, index) => (
              <li key={index}>
                {t(`timeDeclaration.justification.reasons.${reason.type}`)}
                {reason.details && ` - ${reason.details}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
