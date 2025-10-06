
import { useState } from "react";
import EnhancedBreedingCard from "./components/EnhancedBreedingCard";
import ProgressSection from "./components/ProgressSection";
import ActionSection from "./components/ActionSection";
import BabyProfileModal from "./BabyProfileModal";
import { useBreedingProgress } from "./hooks/useBreedingProgress";
import { useBreedingActions } from "./hooks/useBreedingActions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BreedingProgressProps {
  breedingPair: any;
  onUpdate: () => void;
}

const BreedingProgress = ({ breedingPair, onUpdate }: BreedingProgressProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBaby, setSelectedBaby] = useState<any>(null);
  const [isBabyProfileModalOpen, setIsBabyProfileModalOpen] = useState(false);
  const [isCollectingBabies, setIsCollectingBabies] = useState(false);

  const { 
    parent1, 
    parent2, 
    timeRemaining, 
    isReadyToBirth, 
    isReadyToWean, 
    isCompleted, 
    litterBabies,
    fetchLitterBabies
  } = useBreedingProgress(breedingPair, onUpdate);

  const { collectBabies } = useBreedingActions();

  const handleBabyNameClick = (baby: any) => {
    setSelectedBaby(baby);
    setIsBabyProfileModalOpen(true);
  };

  const handleCloseBabyProfileModal = () => {
    setIsBabyProfileModalOpen(false);
    setSelectedBaby(null);
  };

  const handleCollectBabies = async () => {
    if (!user) return;

    setIsCollectingBabies(true);
    try {
      const success = await collectBabies(breedingPair.id, user.id);
      if (success) {
        toast({
          title: "Babies collected!",
          description: `Successfully transferred ${litterBabies.length} babies to your profile and released the parents.`,
        });
        onUpdate();
      }
    } catch (error) {
      console.error("Error collecting babies:", error);
      toast({
        title: "Error",
        description: "Failed to collect babies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCollectingBabies(false);
    }
  };

  const needsManualTransfer = breedingPair.is_weaned && litterBabies.length > 0 && !breedingPair.is_completed;
  const isPastWeanDate = new Date() >= new Date(breedingPair.wean_date);

  return (
    <>
      <EnhancedBreedingCard
        breedingPair={breedingPair}
        title="Breeding Progress"
        description={isCompleted ? "Breeding completed!" : timeRemaining}
        showViewDetails={true}
      >
        <ProgressSection
          breedingPair={breedingPair}
          parent1={parent1}
          parent2={parent2}
          isReadyToBirth={isReadyToBirth}
          isReadyToWean={isReadyToWean}
          isCompleted={isCompleted}
        />

        <ActionSection
          breedingPair={breedingPair}
          isReadyToBirth={isReadyToBirth}
          isReadyToWean={isReadyToWean}
          isCompleted={isCompleted}
          isCollectingBabies={isCollectingBabies}
          litterBabies={litterBabies}
          needsManualTransfer={needsManualTransfer}
          isPastWeanDate={isPastWeanDate}
          onUpdate={onUpdate}
          onCollectBabies={handleCollectBabies}
          onBabyNameClick={handleBabyNameClick}
        />
      </EnhancedBreedingCard>

      {selectedBaby && (
        <BabyProfileModal
          baby={selectedBaby}
          isOpen={isBabyProfileModalOpen}
          onClose={handleCloseBabyProfileModal}
          onUpdate={fetchLitterBabies}
        />
      )}
    </>
  );
};

export default BreedingProgress;
