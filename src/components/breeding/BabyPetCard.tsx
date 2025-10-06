
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBreedImage } from "@/utils/breedImages";
import { renderBreedStats } from "@/utils/statBarUtils";

interface BabyPetCardProps {
  baby: any;
  onAdopt: () => void;
  canAdopt: boolean;
  onNameClick: () => void;
  isPublicView?: boolean;
}

const BabyPetCard = ({ baby, onAdopt, canAdopt, onNameClick, isPublicView = false }: BabyPetCardProps) => {
  const breedImage = getBreedImage(baby.breed);
  
  const getStatColor = (value: number) => {
    const percentage = ((value - 0) / (100 - 0)) * 100;
    if (percentage >= 60) return "text-green-600";
    return "text-gray-600";
  };

  const hasOddStats = baby.breed?.toLowerCase() === 'oddie' || baby.pet_name === 'Oddie';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-pink-200 bg-white/90 backdrop-blur-sm w-full">
      <CardContent className="p-4">
        {/* Horizontal Layout with reduced spacing */}
        <div className="flex items-start gap-4">
          {/* Pet Image - Left Side - Smaller */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full border-2 border-pink-200 overflow-hidden bg-gray-50">
              <img
                src={breedImage}
                alt={baby.breed}
                className="w-full h-full object-cover"
              />
            </div>
            {hasOddStats && (
              <Badge className="absolute -top-1 -right-1 bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5">
                Odd
              </Badge>
            )}
          </div>

          {/* Pet Info and Stats - Right Side with compact layout */}
          <div className="flex-1 min-w-0">
            {/* Pet Name and Breed with Gender */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={onNameClick}
                  className="text-base font-bold text-pink-800 hover:text-pink-600 transition-colors cursor-pointer leading-tight"
                >
                  {baby.pet_name}
                </button>
                <Badge className={`text-xs px-1.5 py-0.5 ${
                  baby.gender === 'Male' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-pink-100 text-pink-800'
                }`}>
                  {baby.gender}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{baby.breed}</p>
            </div>

            {/* Stats Display - Compact */}
            <div className="bg-pink-50 p-2 rounded-lg mb-2">
              <div className="text-xs">
                {renderBreedStats(baby, getStatColor, true)}
              </div>
            </div>

            {/* Action Button */}
            {canAdopt && (
              <Button
                onClick={onAdopt}
                size="sm"
                className="w-full bg-pink-600 hover:bg-pink-700 text-xs py-1"
              >
                Adopt
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BabyPetCard;
