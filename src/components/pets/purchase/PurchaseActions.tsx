
import { Button } from "@/components/ui/button";

interface PurchaseActionsProps {
  validationError: string | null;
  isValidating: boolean;
  isTransferring: boolean;
  userProfile: any;
  price: number;
  onClose: () => void;
  onPurchase: () => void;
}

const PurchaseActions = ({
  validationError,
  isValidating,
  isTransferring,
  userProfile,
  price,
  onClose,
  onPurchase
}: PurchaseActionsProps) => {
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={onClose}
        className="flex-1"
        disabled={isTransferring}
      >
        {validationError ? "Close" : "Cancel"}
      </Button>
      {!validationError && !isValidating && (
        <Button
          onClick={onPurchase}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={isTransferring || !userProfile || userProfile.paw_dollars < price}
        >
          {isTransferring ? "Processing..." : "Buy Pet"}
        </Button>
      )}
    </div>
  );
};

export default PurchaseActions;
