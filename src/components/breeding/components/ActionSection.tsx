
import { Baby } from "lucide-react";
import BreedingActionButtons from "../BreedingActionButtons";
import ManualParentReleaseButton from "../ManualParentReleaseButton";
import AccelerationItem from "../AccelerationItem";
import LitterBabiesGrid from "../LitterBabiesGrid";
import EnhancedCollectButton from "./EnhancedCollectButton";
import CollectionStatusBadge from "./CollectionStatusBadge";

interface ActionSectionProps {
  breedingPair: any;
  isReadyToBirth: boolean;
  isReadyToWean: boolean;
  isCompleted: boolean;
  isCollectingBabies: boolean;
  litterBabies: any[];
  needsManualTransfer: boolean;
  isPastWeanDate: boolean;
  onUpdate: () => void;
  onCollectBabies: () => void;
  onBabyNameClick: (baby: any) => void;
}

const ActionSection = ({
  breedingPair,
  isReadyToBirth,
  isReadyToWean,
  isCompleted,
  isCollectingBabies,
  litterBabies,
  needsManualTransfer,
  isPastWeanDate,
  onUpdate,
  onCollectBabies,
  onBabyNameClick
}: ActionSectionProps) => {
  // Enhanced collection readiness check - check actual date vs wean_date
  const now = new Date();
  const weanDate = new Date(breedingPair.wean_date);
  const isPastWeanDateCheck = now >= weanDate;
  
  // A litter is ready for collection if:
  // 1. Babies are born (is_born = true)
  // 2. Either weaned flag is true OR we're past the wean date
  // 3. There are babies to collect
  // 4. The breeding pair is not already completed
  const isReadyForEnhancedCollection = breedingPair.is_born && 
    (breedingPair.is_weaned || isPastWeanDateCheck) && 
    litterBabies.length > 0 && 
    !breedingPair.is_completed;

  console.log("🔍 Collection Status Check:", {
    is_born: breedingPair.is_born,
    is_weaned: breedingPair.is_weaned,
    isPastWeanDateCheck,
    weanDate: weanDate.toISOString(),
    now: now.toISOString(),
    litterBabies: litterBabies.length,
    is_completed: breedingPair.is_completed,
    isReadyForEnhancedCollection
  });

  return (
    <>
      {/* Collection Status Badge */}
      <div className="flex justify-center mb-4">
        <CollectionStatusBadge 
          breedingPair={breedingPair}
          litterBabies={litterBabies}
          isReadyToCollect={isReadyForEnhancedCollection}
        />
      </div>

      {/* Enhanced Collection Button - Most Prominent */}
      {isReadyForEnhancedCollection && (
        <EnhancedCollectButton
          breedingPair={breedingPair}
          litterBabies={litterBabies}
          onCollected={onUpdate}
        />
      )}

      {/* Legacy Collection Actions for backward compatibility */}
      {(!isReadyForEnhancedCollection || needsManualTransfer) && (
        <>
          {/* Manual Collection Alert */}
          {(needsManualTransfer || (isPastWeanDateCheck && breedingPair.is_born && !breedingPair.is_completed && litterBabies.length > 0)) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-orange-800">Manual Collection Required</h3>
                  <p className="text-orange-600 text-sm">
                    This litter needs manual collection to complete the breeding process.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Breeding Actions */}
          {(!isCompleted || needsManualTransfer) && (
            <BreedingActionButtons
              breedingPair={breedingPair}
              isReadyToBirth={isReadyToBirth}
              isReadyToWean={isReadyToWean}
              isGeneratingBabies={false}
              isCollectingBabies={isCollectingBabies}
              litterBabies={litterBabies}
              onGenerateBabies={() => {}}
              onCollectBabies={onCollectBabies}
            />
          )}
        </>
      )}

      {/* Manual Parent Release */}
      {isCompleted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-800">Breeding Complete</h3>
              <p className="text-blue-600 text-sm">
                Parents should be automatically released. If they're still locked for breeding, you can manually release them.
              </p>
            </div>
            <ManualParentReleaseButton
              breedingPair={breedingPair}
              onSuccess={onUpdate}
            />
          </div>
        </div>
      )}

      {/* Acceleration Options */}
      {!breedingPair.is_born && !isCompleted && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-pink-800 border-b border-pink-200 pb-2">
            Acceleration Options
          </h3>
          <AccelerationItem
            breedingPairs={[breedingPair]}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {/* Litter Babies */}
      {litterBabies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-pink-800 border-b border-pink-200 pb-2 flex items-center gap-2">
            <Baby className="w-5 h-5" />
            Litter Babies ({litterBabies.length})
            {isReadyForEnhancedCollection && (
              <CollectionStatusBadge 
                breedingPair={breedingPair}
                litterBabies={litterBabies}
                isReadyToCollect={isReadyForEnhancedCollection}
              />
            )}
          </h3>
          <LitterBabiesGrid
            babies={litterBabies}
            onAdoptBaby={() => {}}
            userCanAdopt={false}
            onBabyNameClick={onBabyNameClick}
          />
        </div>
      )}
    </>
  );
};

export default ActionSection;
