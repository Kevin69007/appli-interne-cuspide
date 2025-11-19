import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PersonalIssueFlowProps {
  onComplete: (data: any) => void;
}

export const PersonalIssueFlow = ({ onComplete }: PersonalIssueFlowProps) => {
  const { t } = useTranslation('planning');

  useEffect(() => {
    // Auto-validate as this covers all the missing time
    onComplete({
      couvreIntegralite: true
    });
  }, [onComplete]);

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Cette raison couvre l'intégralité du temps manquant.
      </AlertDescription>
    </Alert>
  );
};
