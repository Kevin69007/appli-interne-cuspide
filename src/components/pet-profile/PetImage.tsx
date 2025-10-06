
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PetImageProps {
  imageUrl?: string;
  petName: string;
  breed?: string;
  petType?: string;
  className?: string;
  isForumModal?: boolean;
  pet?: any;
}

const PetImage = ({ imageUrl, petName, breed, petType, className, isForumModal = false, pet }: PetImageProps) => {
  console.log('🎯 PetImage - rendering for:', petName, 'breed:', breed, 'isForumModal:', isForumModal);
  
  // Create pet object in the format expected by PetImageDisplay
  const petData = pet || {
    pet_name: petName,
    breed: breed,
    pets: {
      name: petType,
      image_url: imageUrl
    }
  };

  // Use custom className if provided, otherwise use context-appropriate styling
  let containerClass;
  let imageClass;
  
  if (className) {
    containerClass = className;
    imageClass = "w-full h-full object-cover";
  } else if (isForumModal) {
    // Forum modal styling - compact and contained
    containerClass = "w-full rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-pink-200 mb-4";
    imageClass = "w-full h-full object-contain p-2";
  } else {
    // User profile modal styling - square aspect ratio for full image visibility
    containerClass = "w-full rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-pink-200 mb-4";
    imageClass = "w-full h-full object-cover";
  }

  return (
    <div className={containerClass}>
      <AspectRatio ratio={1} className="w-full">
        <PetImageDisplay
          pet={petData}
          alt={petName}
          className={imageClass}
        />
      </AspectRatio>
    </div>
  );
};

export default PetImage;
