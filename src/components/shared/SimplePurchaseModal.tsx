
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";



import { getAdoptionCost } from "@/utils/breedImages";

interface SimplePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: ((selectedGender: string) => void | Promise<void>) | (() => void | Promise<void>);
  petName: string;
  breed?: string;
  cost?: number;
  userBalance: number;
  isProcessing: boolean;
  isFirstPet?: boolean;
  userDefaultGender?: string;
  currencyType?: string;
  isFree?: boolean;
}

const SimplePurchaseModal = ({
  isOpen,
  onClose,
  onConfirm,
  petName,
  breed,
  cost: fixedCost,
  userBalance,
  isProcessing,
  isFirstPet = false,
  userDefaultGender = 'male',
  currencyType = "PawDollars",
  isFree = false
}: SimplePurchaseModalProps) => {
  const selectedGender = userDefaultGender;
  const hasGenderSelection = false;

  const dynamicCost = breed ? getAdoptionCost(breed, selectedGender, isFirstPet) : 0;
  const cost = fixedCost !== undefined ? fixedCost : dynamicCost;
  const actualIsFree = isFree || isFirstPet;
  const canAfford = userBalance >= cost || actualIsFree;

  const handleConfirm = () => {
    // Always pass the selected gender (even if there's no UI selection)
    (onConfirm as (selectedGender: string) => void)(selectedGender);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">
            Adopt {petName}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
            
          <div className={`text-center ${hasGenderSelection ? 'border-t pt-3' : ''}`}>
            {actualIsFree ? (
              <p className="text-green-600 font-medium">
                🎉 Your first pet is free!
              </p>
            ) : (
              <p className="text-gray-700 font-medium">
                Cost: {cost.toLocaleString()} {currencyType}
              </p>
            )}
          </div>

          {!canAfford && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
              <p className="text-red-600 text-sm">
                You need {(cost - userBalance).toLocaleString()} more {currencyType}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className={`flex-1 ${
                canAfford 
                  ? 'bg-pink-600 hover:bg-pink-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!canAfford || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  {actualIsFree ? 'Adopt Free!' : 'Adopt'}
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePurchaseModal;
