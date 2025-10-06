
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart } from "lucide-react";
import ParentSelectionForm from "./components/ParentSelectionForm";
import { useBreedingLogic } from "./hooks/useBreedingLogic";
import { useToast } from "@/hooks/use-toast";
import { getValidParentBreed } from "./utils/breedValidation";

const BreedingInterface = () => {
  const { toast } = useToast();
  const {
    availablePets,
    selectedParent1,
    selectedParent2,
    isLoading,
    isBreeding,
    userLicenseCount,
    setSelectedParent1,
    setSelectedParent2,
    getCompatiblePets,
    startBreeding
  } = useBreedingLogic();

  const getFirstParentOptions = () => {
    return availablePets
      .filter(pet => {
        if (pet.breeding_cooldown_until) {
          const cooldownEnd = new Date(pet.breeding_cooldown_until);
          if (cooldownEnd > new Date()) {
            return false;
          }
        }
        return true;
      })
      .map(pet => ({
        value: pet.id,
        label: `${pet.pet_name} (${pet.gender}, ${pet.breed || pet.pets?.name})`,
        pet: pet
      }));
  };

  const getSecondParentOptions = () => {
    if (!selectedParent1) return [];
    
    return getCompatiblePets(selectedParent1).map(pet => ({
      value: pet.id,
      label: `${pet.pet_name} (${pet.gender}, ${pet.breed || pet.pets?.name})`,
      pet: pet
    }));
  };

  const handleStartBreeding = async () => {
    if (!selectedParent1 || !selectedParent2) {
      toast({
        title: "Select Both Parents",
        description: "Please select two pets for breeding",
        variant: "destructive",
      });
      return;
    }

    if (userLicenseCount < 2) {
      toast({
        title: "Insufficient Litter Licenses",
        description: "You need 2 litter licenses to start breeding (one for each pet)",
        variant: "destructive",
      });
      return;
    }

    if (selectedParent1.gender === selectedParent2.gender) {
      toast({
        title: "Invalid Breeding Pair",
        description: "Please select one male and one female pet",
        variant: "destructive",
      });
      return;
    }

    const parent1Breed = getValidParentBreed(selectedParent1);
    const parent2Breed = getValidParentBreed(selectedParent2);
    const parent1Type = selectedParent1.pets?.type;
    const parent2Type = selectedParent2.pets?.type;

    if (!parent1Breed || !parent2Breed) {
      toast({
        title: "Invalid Breeding Pair",
        description: "One or both pets have invalid breeds for breeding",
        variant: "destructive",
      });
      return;
    }

    if (parent1Type !== parent2Type) {
      toast({
        title: "Incompatible Pet Types",
        description: "Pets must be the same species to breed together",
        variant: "destructive",
      });
      return;
    }

    startBreeding(selectedParent1.id, selectedParent2.id);
  };

  const handleParent1Select = (pet: any) => {
    setSelectedParent1(pet);
    if (selectedParent2 && pet && !getCompatiblePets(pet).find(p => p.id === selectedParent2.id)) {
      setSelectedParent2(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Select Breeding Pair
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ParentSelectionForm
            selectedParent1={selectedParent1}
            selectedParent2={selectedParent2}
            firstParentOptions={getFirstParentOptions()}
            secondParentOptions={getSecondParentOptions()}
            userLicenseCount={userLicenseCount}
            onParent1Select={handleParent1Select}
            onParent2Select={setSelectedParent2}
            onStartBreeding={handleStartBreeding}
            isBreeding={isBreeding}
          />
          <Separator />
        </CardContent>
      </Card>
    </div>
  );
};

export default BreedingInterface;
