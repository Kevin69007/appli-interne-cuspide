
import { Badge } from "@/components/ui/badge";

interface PetBasicInfoProps {
  pet: any;
}

const PetBasicInfo = ({ pet }: PetBasicInfoProps) => {
  // Use the sequential pet number from database, fallback to 1 if not set
  const petNumber = pet?.pet_number || 1;

  // Always use pet.breed as the primary source of truth for breed display
  const displayBreed = pet.breed || pet.pets?.name;

  return (
    <div className="flex items-center gap-2 justify-center">
      <Badge variant="outline" className="capitalize">
        {pet.gender}
      </Badge>
      <Badge variant="outline" className="capitalize">
        {displayBreed}
      </Badge>
      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
        #{petNumber}
      </Badge>
    </div>
  );
};

export default PetBasicInfo;
