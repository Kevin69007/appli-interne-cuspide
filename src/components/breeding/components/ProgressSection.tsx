
import LitterInfoCard from "../LitterInfoCard";
import BreedingProgressBar from "../BreedingProgressBar";
import ParentCard from "../ParentCard";

interface ProgressSectionProps {
  breedingPair: any;
  parent1: any;
  parent2: any;
  isReadyToBirth: boolean;
  isReadyToWean: boolean;
  isCompleted: boolean;
}

const ProgressSection = ({
  breedingPair,
  parent1,
  parent2,
  isReadyToBirth,
  isReadyToWean,
  isCompleted
}: ProgressSectionProps) => {
  return (
    <>
      {/* Litter Information */}
      <LitterInfoCard breedingPair={breedingPair} />

      {/* Progress Bar - Show for active breeding */}
      {!isCompleted && (
        <BreedingProgressBar 
          breedingPair={breedingPair}
          isReadyToBirth={isReadyToBirth}
          isReadyToWean={isReadyToWean}
        />
      )}

      {/* Parent Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParentCard pet={parent1} title="Parent 1" />
        <ParentCard pet={parent2} title="Parent 2" />
      </div>
    </>
  );
};

export default ProgressSection;
