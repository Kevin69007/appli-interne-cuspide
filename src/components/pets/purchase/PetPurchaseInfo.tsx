
import { Badge } from "@/components/ui/badge";
import { getGenderIcon, getGenderColor } from "@/utils/petHelpers";
import { calculatePetNumber } from "@/utils/petNumberUtils";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface PetPurchaseInfoProps {
  pet: any;
  capitalizedPetName: string;
}

const PetPurchaseInfo = ({ pet, capitalizedPetName }: PetPurchaseInfoProps) => {
  const petNumber = calculatePetNumber(pet);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <PetImageDisplay
          pet={pet}
          alt={capitalizedPetName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          <h3 className="font-semibold text-pink-800">{capitalizedPetName}</h3>
          {pet.gender && (
            <span className={`text-sm font-bold ${getGenderColor(pet.gender)}`}>
              {getGenderIcon(pet.gender)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 capitalize">
          {pet.breed || pet.pets?.name}
        </p>
        <Badge variant="outline" className="text-xs mt-1">
          #{petNumber}
        </Badge>
      </div>
    </div>
  );
};

export default PetPurchaseInfo;
