import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface NoWorkFlowProps {
  onComplete: (data: any) => void;
}

export const NoWorkFlow = ({ onComplete }: NoWorkFlowProps) => {
  const { t } = useTranslation('planning');

  useEffect(() => {
    // Auto-validate as this covers all the missing time and manager is informed
    onComplete({
      couvreIntegralite: true,
      manager_informe: true
    });
  }, [onComplete]);

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Cette raison couvre l'intégralité du temps manquant. Votre manager a été informé.
      </AlertDescription>
    </Alert>
  );
};
