
import { getBreedImage } from "@/utils/breedImages";

interface PetBreedIconProps {
  breed: string;
  className?: string;
}

const PetBreedIcon = ({ breed, className = "w-8 h-8" }: PetBreedIconProps) => {
  const imageUrl = getBreedImage(breed);

  return (
    <div className={`${className} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center`}>
      <img
        src={imageUrl}
        alt={breed}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Show white loading indicator on error
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent && !parent.querySelector('.loading-indicator')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator animate-spin rounded-full h-6 w-6 border-b-2 border-white';
            parent.appendChild(loadingDiv);
          }
        }}
      />
    </div>
  );
};

export default PetBreedIcon;
