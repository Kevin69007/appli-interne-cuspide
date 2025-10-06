
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import SimplePurchaseModal from "@/components/shared/SimplePurchaseModal";
import { isMaleRareBreed } from "@/utils/breedImages";

interface Pet {
  id: string;
  name: string;
  type: string;
  image_url: string;
  breed: string;
  gender: string;
  birthday: string;
  base_friendliness: number;
  base_playfulness: number;
  base_energy: number;
  base_loyalty: number;
  base_curiosity: number;
  hasSpecialStats?: boolean;
}

interface AdoptPetCardProps {
  pet: Pet;
  onAdopt: (pet: Pet, petName: string, gender: string) => void;
  isAdopting: boolean;
  userBalance: number;
  userDefaultGender: string;
  isFirstPet: boolean;
  adoptionCost: number;
}

const AdoptPetCard = ({ 
  pet, 
  onAdopt, 
  isAdopting, 
  userBalance, 
  userDefaultGender,
  isFirstPet,
  adoptionCost 
}: AdoptPetCardProps) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handleAdoptClick = () => {
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirmation = (selectedGender: string) => {
    onAdopt(pet, pet.name, selectedGender);
    setShowPurchaseModal(false);
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
  };

  // Check if pet has special stats
  const hasLostStats = [
    pet.base_friendliness,
    pet.base_playfulness,
    pet.base_energy,
    pet.base_loyalty,
    pet.base_curiosity
  ].some(stat => stat < 0);

  const hasOverStats = [
    pet.base_friendliness,
    pet.base_playfulness,
    pet.base_energy,
    pet.base_loyalty,
    pet.base_curiosity
  ].some(stat => stat > 100);

  // Check if this is a rare male Tortie (for breeding restrictions only)
  const isRareMale = isMaleRareBreed(pet.breed, pet.gender);

  return (
    <>
      <Card className={`bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${
        hasLostStats ? 'border-purple-500 shadow-purple-200' : 
        hasOverStats ? 'border-yellow-500 shadow-yellow-200' : 'border-pink-200'
      }`}>
        <CardHeader>
          <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-pink-100 to-purple-100">
            <PetImageDisplay
              pet={{
                pet_name: pet.name,
                breed: pet.breed,
                pets: { name: pet.type, image_url: pet.image_url }
              }}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-pink-800">{pet.name}</CardTitle>
          <CardDescription className="capitalize">
            {pet.type}
          </CardDescription>
          {hasLostStats && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Has Lost Stats - Rare!
            </Badge>
          )}
          {hasOverStats && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Has Over Stats - Rare!
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAdoptClick}
            disabled={isAdopting}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            <Heart className="w-4 h-4 mr-2" />
            Adopt Me!
          </Button>
        </CardContent>
      </Card>

      <SimplePurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onConfirm={handlePurchaseConfirmation}
        petName={pet.name}
        breed={pet.breed}
        userBalance={userBalance}
        isProcessing={isAdopting}
        isFirstPet={isFirstPet}
        userDefaultGender={userDefaultGender}
      />
    </>
  );
};

export default AdoptPetCard;
