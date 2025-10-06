
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Baby, Gift, Loader2 } from "lucide-react";
import { useBreedingActions } from "./hooks/useBreedingActions";

interface BreedingActionButtonsProps {
  breedingPair: any;
  isReadyToBirth: boolean;
  isReadyToWean: boolean;
  isGeneratingBabies: boolean;
  isCollectingBabies: boolean;
  litterBabies: any[];
  onGenerateBabies: () => void;
  onCollectBabies: () => void;
}

const BreedingActionButtons = ({
  breedingPair,
  isReadyToBirth,
  isReadyToWean,
  isGeneratingBabies,
  isCollectingBabies,
  litterBabies,
  onGenerateBabies,
  onCollectBabies
}: BreedingActionButtonsProps) => {
  const [isGivingBirth, setIsGivingBirth] = useState(false);
  const [isWeaning, setIsWeaning] = useState(false);
  const { accelerateBreeding, accelerateWeaning } = useBreedingActions();

  const handleGiveBirth = async () => {
    setIsGivingBirth(true);
    try {
      const success = await accelerateBreeding(breedingPair.id);
      if (success) {
        // Trigger parent component update
        window.dispatchEvent(new CustomEvent('breeding-update'));
      }
    } finally {
      setIsGivingBirth(false);
    }
  };

  const handleWeanBabies = async () => {
    setIsWeaning(true);
    try {
      const success = await accelerateWeaning(breedingPair.id);
      if (success) {
        // Trigger parent component update
        window.dispatchEvent(new CustomEvent('breeding-update'));
      }
    } finally {
      setIsWeaning(false);
    }
  };

  // Don't show buttons if breeding is completed
  if (breedingPair.is_completed) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Give Birth Button */}
      {!breedingPair.is_born && isReadyToBirth && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-pink-800">Ready to Give Birth!</h3>
              <p className="text-pink-600 text-sm">
                Your pets are ready to welcome their new babies. Litter size will be randomly determined (1-6 babies).
              </p>
            </div>
            <Button
              onClick={handleGiveBirth}
              disabled={isGivingBirth}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isGivingBirth ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Giving Birth...
                </>
              ) : (
                <>
                  <Baby className="w-4 h-4 mr-2" />
                  Give Birth
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Generate/Wean Babies Button */}
      {breedingPair.is_born && !breedingPair.is_weaned && isReadyToWean && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-800">Ready to Wean!</h3>
              <p className="text-blue-600 text-sm">
                The weaning period is complete. Generate the babies now!
              </p>
            </div>
            <Button
              onClick={handleWeanBabies}
              disabled={isWeaning || isGeneratingBabies}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {(isWeaning || isGeneratingBabies) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Baby className="w-4 h-4 mr-2" />
                  Generate Babies
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Legacy Collect Babies Button (fallback for edge cases) */}
      {breedingPair.is_weaned && litterBabies.length > 0 && !breedingPair.is_completed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">Ready to Collect!</h3>
              <p className="text-green-600 text-sm">
                Your babies are ready to join your collection.
              </p>
            </div>
            <Button
              onClick={onCollectBabies}
              disabled={isCollectingBabies}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isCollectingBabies ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Collecting...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Collect Babies
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreedingActionButtons;
