import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import PetStatsDisplay from "@/components/pets/PetStatsDisplay";

interface PetCardProps {
  pet: {
    id: string;
    pet_name: string;
    breed?: string;
    pets?: {
      name: string;
      image_url?: string;
    };
    friendliness: number;
    playfulness: number;
    energy: number;
    loyalty: number;
    curiosity: number;
    hunger?: number;
    water?: number;
    is_locked?: boolean;
    pet_number?: number;
    birthday?: string;
    adopted_at?: string;
    last_fed?: string;
    last_watered?: string;
    gender?: string;
    description?: string;
    about_section?: string;
  };
  showPrice?: boolean;
  price?: number;
  onAdopt?: () => void;
  onViewProfile?: () => void;
  showStats?: boolean;
  isForSale?: boolean;
  sellerUsername?: string;
  onPurchaseClick?: () => void;
  showOwnerInfo?: boolean;
}

const PetCard = ({ 
  pet, 
  showPrice = false, 
  price, 
  onAdopt, 
  onViewProfile,
  showStats = true,
  isForSale = false,
  sellerUsername,
  onPurchaseClick,
  showOwnerInfo = false
}: PetCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const handleAdopt = () => {
    if (onAdopt) {
      onAdopt();
    } else {
      toast({
        title: "Adoption not available",
        description: "This pet is not available for adoption right now.",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile();
    } else {
      // Navigate to the full pet profile URL
      window.location.href = `https://pawpets.org/pet/${pet.pet_number || 1}`;
    }
  };

  const getBreedName = () => {
    return pet.breed || pet.pets?.name || 'Mixed Breed';
  };

  return (
    <Card 
      className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-all duration-200 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="relative">
          <div className="w-full h-48 rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-pink-50 to-purple-50">
            <PetImageDisplay
              pet={pet}
              alt={pet.pet_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-pink-800 mb-1 transition-colors">
                {pet.pet_name}
              </CardTitle>
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant="outline" className="text-xs">
                  {getBreedName()}
                </Badge>
                {pet.pet_number && (
                  <Badge variant="secondary" className="text-xs">
                    #{pet.pet_number}
                  </Badge>
                )}
                {pet.gender && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {pet.gender}
                  </Badge>
                )}
              </div>
            </div>
            
            {showPrice && price && (
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {price} PD
                </div>
                {sellerUsername && showOwnerInfo && (
                  <div className="text-xs text-gray-500">
                    by {sellerUsername}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Pet Stats */}
        {showStats && (
          <PetStatsDisplay pet={pet} />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onAdopt && (
            <Button
              onClick={handleAdopt}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-2" />
              Adopt
            </Button>
          )}
          
          {onViewProfile && (
            <Button
              onClick={handleViewProfile}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          )}
        </div>

        {/* Additional Info */}
        {pet.birthday && (
          <div className="text-xs text-gray-500 text-center">
            Born: {new Date(pet.birthday).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PetCard;
