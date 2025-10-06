
import { AspectRatio } from "@/components/ui/aspect-ratio";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface ShelterPetImageProps {
  pet: any;
}

const ShelterPetImage = ({ pet }: ShelterPetImageProps) => {
  // Create pet object for PetImageDisplay
  const petForImageDisplay = {
    pet_name: pet.pet_name,
    breed: pet.breed,
    pets: {
      name: pet.pet_type,
      image_url: null
    }
  };

  return (
    <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-pink-100 to-purple-100">
      <AspectRatio ratio={1}>
        <PetImageDisplay
          pet={petForImageDisplay}
          alt={pet.pet_name}
          className="w-full h-full object-cover"
        />
      </AspectRatio>
    </div>
  );
};

export default ShelterPetImage;
