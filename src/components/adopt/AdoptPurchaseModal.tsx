
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Coins, Heart } from "lucide-react";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface AdoptPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pet: any;
  petName: string;
  selectedGender: string;
  adoptionCost: number;
  userBalance: number;
  isFirstPet: boolean;
  isProcessing: boolean;
  onNameChange: (name: string) => void;
  onGenderChange: (gender: string) => void;
  availableGenders: string[];
}

const AdoptPurchaseModal = ({
  isOpen,
  onClose,
  onConfirm,
  pet,
  petName,
  selectedGender,
  adoptionCost,
  userBalance,
  isFirstPet,
  isProcessing,
  onNameChange,
  onGenderChange,
  availableGenders
}: AdoptPurchaseModalProps) => {
  const canAfford = userBalance >= adoptionCost || isFirstPet;
  const actualCost = isFirstPet ? 0 : adoptionCost;

  console.log("AdoptPurchaseModal render:", {
    isOpen,
    adoptionCost,
    actualCost,
    isFirstPet,
    canAfford,
    userBalance,
    availableGenders
  });

  const handleConfirm = () => {
    if (!petName.trim()) {
      console.log("AdoptPurchaseModal - Pet name is empty, not proceeding");
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-700">
            <Heart className="w-5 h-5" />
            Adopt Your New Pet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pet Info */}
          <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <PetImageDisplay
                pet={{
                  pet_name: petName || pet.name,
                  breed: pet.breed,
                  pets: { name: pet.type, image_url: pet.image_url }
                }}
                alt={petName || pet.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-pink-800 capitalize">{pet.breed}</h3>
              <p className="text-sm text-gray-600 capitalize">{pet.type}</p>
            </div>
          </div>

          {/* Pet Name Input */}
          <div>
            <Label htmlFor="pet-name" className="text-sm font-medium">Pet Name</Label>
            <Input
              id="pet-name"
              value={petName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter a name for your pet"
              className="mt-1"
            />
          </div>

          {/* Gender Selection - Only show if multiple genders available and not Tortie */}
          {availableGenders.length > 1 && pet.breed !== 'Tortie' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Gender</Label>
              <RadioGroup 
                value={selectedGender} 
                onValueChange={onGenderChange}
                className="flex space-x-4"
              >
                {availableGenders.includes('male') && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <label htmlFor="male" className="text-sm flex items-center">
                      ♂️ Male
                    </label>
                  </div>
                )}
                {availableGenders.includes('female') && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <label htmlFor="female" className="text-sm flex items-center">
                      ♀️ Female
                    </label>
                  </div>
                )}
              </RadioGroup>
            </div>
          )}

          {/* Tortie Gender Notice */}
          {pet.breed === 'Tortie' && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-800 font-medium text-sm">
                🧬 Tortoiseshell cats are genetically only female
              </p>
            </div>
          )}

          {/* Cost Information */}
          <div className={`text-center p-4 rounded-lg ${isFirstPet ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className={`text-2xl font-bold flex items-center justify-center gap-2 mb-2 ${
              isFirstPet ? 'text-green-700' : 'text-yellow-700'
            }`}>
              <Coins className="w-6 h-6" />
              {actualCost} Paw Dollars
            </div>
            {isFirstPet && (
              <p className="text-green-600 text-sm font-medium">
                🎉 Your first pet is FREE!
              </p>
            )}
          </div>

          {/* Balance Check */}
          <div className="text-center text-sm text-gray-600">
            Your balance: {userBalance} PD
            {canAfford ? (
              <span className="text-green-600 ml-2">✓ {isFirstPet ? 'First pet is free!' : 'Sufficient funds'}</span>
            ) : (
              <span className="text-red-600 ml-2">✗ Insufficient funds</span>
            )}
          </div>

          {/* Special Stats Notice */}
          {(pet.hasSpecialStats || pet.base_friendliness < 0 || pet.base_playfulness < 0 || pet.base_energy < 0 || pet.base_loyalty < 0 || pet.base_curiosity < 0) && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-800 font-medium text-sm">
                ⭐ This pet has special stats - Rare find!
              </p>
            </div>
          )}

          {/* Actions */}
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
              className="flex-1 bg-pink-600 hover:bg-pink-700"
              disabled={!canAfford || isProcessing || !petName.trim()}
            >
              {isProcessing ? "Adopting..." : isFirstPet ? "Adopt for FREE!" : "Confirm Adoption"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptPurchaseModal;
