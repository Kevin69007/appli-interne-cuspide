
import ShelterPetCard from "@/components/shelter/ShelterPetCard";

interface ShelterPetGridProps {
  pets: any[];
  onAdopt: () => void;
}

const ShelterPetGrid = ({ pets, onAdopt }: ShelterPetGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {pets.map((pet) => (
        <ShelterPetCard
          key={pet.id}
          pet={pet}
          onAdopt={onAdopt}
        />
      ))}
    </div>
  );
};

export default ShelterPetGrid;
