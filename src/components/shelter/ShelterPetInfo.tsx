
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ShelterPetInfoProps {
  pet: any;
}

const ShelterPetInfo = ({ pet }: ShelterPetInfoProps) => {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <CardTitle className="text-pink-800 text-lg leading-tight">{pet.pet_name}</CardTitle>
        <CardDescription className="text-sm mt-1">
          {pet.breed} • {pet.gender}
        </CardDescription>
      </div>
      {pet.pet_number && (
        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
          #{pet.pet_number}
        </Badge>
      )}
    </div>
  );
};

export default ShelterPetInfo;
