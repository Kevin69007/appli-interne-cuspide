
import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users } from "lucide-react";
import { renderBreedStats } from "@/utils/statBarUtils";
import { getAvailableGenders } from "@/utils/breedImages";
import SimplePurchaseModal from "@/components/shared/SimplePurchaseModal";

interface AdoptablePetCardProps {
  pet: any;
  selectedGender: string;
  onGenderChange: (petId: string, gender: string) => void;
  onAdopt: (pet: any) => void;
  stats: any;
  availableGenders: string[];
  userBalance?: number;
}

const AdoptablePetCard = ({ 
  pet, 
  selectedGender, 
  onGenderChange, 
  onAdopt, 
  stats,
  availableGenders,
  userBalance = 0
}: AdoptablePetCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const getStatColor = useCallback((value: number) => {
    if (value >= 60) return "bg-green-500";
    return "bg-gray-400";
  }, []);

  const breedAvailableGenders = useMemo(() => getAvailableGenders(pet.breed), [pet.breed]);
  const shouldShowGenderSelection = useMemo(() => breedAvailableGenders.length > 1, [breedAvailableGenders.length]);

  const petWithStats = useMemo(() => ({
    ...pet,
    friendliness: stats.friendliness,
    playfulness: stats.playfulness,
    energy: stats.energy,
    loyalty: stats.loyalty,
    curiosity: stats.curiosity,
    breed: pet.breed
  }), [pet, stats.friendliness, stats.playfulness, stats.energy, stats.loyalty, stats.curiosity]);

  const handleAdoptClick = () => {
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirmation = async () => {
    setIsProcessing(true);
    try {
      await onAdopt(pet);
      setShowPurchaseModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-all duration-200 overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          {/* Pet Image */}
          <div className="relative aspect-square mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-pink-600"></div>
              </div>
            )}
            
            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-600">
                <Users className="w-8 h-8 sm:w-12 sm:h-12 mb-2" />
                <span className="text-xs sm:text-sm font-medium">{pet.breed}</span>
              </div>
            ) : (
              <img
                src={pet.image_url}
                alt={`${pet.breed} ${pet.name}`}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
          </div>

          {/* Pet Info */}
          <div className="space-y-2 sm:space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-pink-800 text-sm sm:text-base truncate">{pet.name}</h3>
            </div>

            {/* Gender Selection - Only show if breed has multiple gender options */}
            {shouldShowGenderSelection && (
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-pink-700 mb-2">Select Gender</p>
                <div className="flex gap-1 sm:gap-2">
                  {breedAvailableGenders.map((gender) => (
                    <label key={gender} className="flex items-center cursor-pointer flex-1">
                      <input
                        type="radio"
                        name={`gender-${pet.id}`}
                        value={gender === 'male' ? 'Male' : 'Female'}
                        checked={selectedGender.toLowerCase() === gender}
                        onChange={() => onGenderChange(pet.id, gender === 'male' ? 'Male' : 'Female')}
                        className="sr-only"
                      />
                      <div className={`flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors border-2 w-full ${
                        selectedGender.toLowerCase() === gender
                          ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-white text-pink-700 border-pink-200 hover:border-pink-300'
                      }`}>
                        <span className="text-sm">{gender === 'male' ? '♂' : '♀'}</span>
                        <span className="truncate">{gender === 'male' ? 'Male' : 'Female'}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* For female-only breeds, show the gender as info with matching styling */}
            {!shouldShowGenderSelection && (
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-pink-700 mb-2">Gender</p>
                <div className="flex gap-1 sm:gap-2">
                  <div className="flex items-center justify-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pink-500 text-white border-2 border-pink-500 w-full">
                    <span className="text-sm">♀</span>
                    <span className="truncate">Female</span>
                  </div>
                </div>
              </div>
            )}

            {/* Personality Traits */}
            <div className="bg-pink-50 rounded-lg p-2 sm:p-3">
              <h4 className="text-xs sm:text-sm font-medium text-pink-700 mb-2 text-center">Personality Traits</h4>
              <div className="space-y-1 sm:space-y-2">
                {renderBreedStats(petWithStats, getStatColor, true)}
              </div>
            </div>

            {/* Adoption Button */}
            <Button 
              onClick={handleAdoptClick}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white h-9 sm:h-10 text-sm font-medium rounded-full"
            >
              <Heart className="w-4 h-4 mr-2" />
              Adopt Me!
            </Button>
          </div>
        </CardContent>
      </Card>

      <SimplePurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onConfirm={handlePurchaseConfirmation}
        petName={pet.name}
        breed={pet.breed}
        userBalance={userBalance}
        isProcessing={isProcessing}
        isFirstPet={false}
        userDefaultGender={selectedGender.toLowerCase()}
      />
    </>
  );
};

export default AdoptablePetCard;
