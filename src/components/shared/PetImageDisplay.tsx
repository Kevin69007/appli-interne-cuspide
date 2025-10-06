
import { getBreedImage } from "@/utils/breedImages";
import { useState } from "react";

interface PetImageDisplayProps {
  pet: {
    pet_name: string;
    breed?: string;
    pets?: {
      name?: string;
      image_url?: string;
    };
  };
  alt?: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const PetImageDisplay = ({ pet, alt, className = "w-full h-full object-cover", onError }: PetImageDisplayProps) => {
  const [imageError, setImageError] = useState(false);

  const getImageUrl = () => {
    // SINGLE SOURCE OF TRUTH: Always use user_pets.breed for image lookup
    if (pet.breed && pet.breed.trim() !== '') {
      const breedImageUrl = getBreedImage(pet.breed);
      return breedImageUrl;
    }

    // Emergency fallback only if no breed is set
    if (pet.pets?.name && pet.pets.name.trim() !== '') {
      const typeImageUrl = getBreedImage(pet.pets.name);
      return typeImageUrl;
    }

    // Final fallback to placeholder
    return "/placeholder.svg";
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    
    if (onError) {
      onError(e);
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const imageUrl = getImageUrl();

  // If we know it's going to error or we've had an error, go straight to placeholder
  if (imageError || imageUrl === "/placeholder.svg") {
    return (
      <img
        src="/placeholder.svg"
        alt={alt || pet.pet_name}
        className={className}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || pet.pet_name}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default PetImageDisplay;
