
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderBreedStats, hasOddStats } from "@/utils/statBarUtils";
import { getBreedStatConfig } from "@/utils/breedStatConfig";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface ParentCardProps {
  pet: any;
  title: string;
  isSelected?: boolean;
  onClick?: () => void;
}

const ParentCard = ({ pet, title, isSelected, onClick }: ParentCardProps) => {
  if (!pet) {
    return (
      <Card 
        className={`bg-white/90 backdrop-blur-sm shadow-lg border-2 border-dashed border-pink-300 hover:border-pink-400 transition-colors cursor-pointer ${
          isSelected ? 'ring-2 ring-pink-500' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
          </div>
          <p className="text-sm text-gray-500">Select {title}</p>
        </CardContent>
      </Card>
    );
  }

  const getStatColor = (value: number) => {
    const percentage = ((value - 0) / (100 - 0)) * 100;
    if (percentage >= 60) return "text-green-600";
    return "text-gray-600";
  };

  // Use the proper stat rendering utility
  const isOddStatPet = hasOddStats(pet);

  return (
    <Card 
      className={`bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${isSelected ? 'ring-2 ring-pink-500' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-pink-200 mb-3 overflow-hidden">
            <PetImageDisplay
              pet={{
                pet_name: pet.pet_name,
                breed: pet.breed,
                pets: pet.pets
              }}
              alt={pet.pet_name}
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-lg text-pink-800 mb-2">{pet.pet_name}</CardTitle>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="capitalize">
              {pet.gender}
            </Badge>
            <Badge variant="secondary">
              {pet.breed || pet.pets?.name}
            </Badge>
            {isOddStatPet && (
              <Badge className="bg-orange-100 text-orange-800">
                Odd Stats
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Render stats using the proper utility */}
        {renderBreedStats(pet, getStatColor, true)}
      </CardContent>
    </Card>
  );
};

export default ParentCard;
