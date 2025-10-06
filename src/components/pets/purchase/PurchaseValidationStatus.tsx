
import { AlertTriangle, CheckCircle } from "lucide-react";

interface PurchaseValidationStatusProps {
  isValidating: boolean;
  validationError: string | null;
}

const PurchaseValidationStatus = ({ isValidating, validationError }: PurchaseValidationStatusProps) => {
  if (isValidating) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <p className="text-blue-800 text-sm">Validating sale...</p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
        <div>
          <p className="text-red-800 font-medium text-sm">Invalid Sale</p>
          <p className="text-red-700 text-xs">{validationError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
      <p className="text-green-800 text-sm font-medium">Sale verified and ready for purchase</p>
    </div>
  );
};

export default PurchaseValidationStatus;
