
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import LandingPetCard from "./LandingPetCard";

interface Pet {
  id: string;
  name: string;
  type: string;
  image_url: string;
  breed: string;
  gender: string;
  birthday: string;
  base_friendliness: number;
  base_playfulness: number;
  base_energy: number;
  base_loyalty: number;
  base_curiosity: number;
}

interface PetSelectionSectionProps {
  filteredPets: Pet[];
  selectedPetType: string;
  selectedGenders: {[key: string]: string};
  loading: boolean;
  onPetTypeChange: (value: string) => void;
  onGenderSelection: (petId: string, gender: string) => void;
  onAdoptPet: (pet: Pet) => void;
}

const PetSelectionSection = ({
  filteredPets,
  selectedPetType,
  selectedGenders,
  loading,
  onPetTypeChange,
  onGenderSelection,
  onAdoptPet
}: PetSelectionSectionProps) => {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-pink-800 mb-4">
          Select Your New Best Friend!
        </h2>
        <p className="text-pink-600 text-lg mb-6">
          Choose from these adorable pets waiting for their forever homes!
        </p>
        
        <div className="flex justify-center mb-6">
          <ToggleGroup 
            type="single" 
            value={selectedPetType} 
            onValueChange={(value) => onPetTypeChange(value || "all")}
            className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border-2 border-pink-200"
          >
            <ToggleGroupItem 
              value="all" 
              className="data-[state=on]:bg-gradient-to-r data-[state=on]:from-pink-500 data-[state=on]:to-pink-600 data-[state=on]:text-white"
            >
              All Pets
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="dog"
              className="data-[state=on]:bg-gradient-to-r data-[state=on]:from-pink-500 data-[state=on]:to-pink-600 data-[state=on]:text-white"
            >
              Dogs
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="cat"
              className="data-[state=on]:bg-gradient-to-r data-[state=on]:from-pink-500 data-[state=on]:to-pink-600 data-[state=on]:text-white"
            >
              Cats
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">🔍 Finding your perfect pets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => {
            const selectedGender = selectedGenders[pet.id] || "male";
            
            return (
              <LandingPetCard
                key={pet.id}
                pet={pet}
                selectedGender={selectedGender}
                onGenderSelection={onGenderSelection}
                onAdoptPet={onAdoptPet}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PetSelectionSection;
