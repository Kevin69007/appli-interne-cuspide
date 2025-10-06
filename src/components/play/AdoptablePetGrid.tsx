
import AdoptablePetCard from "./AdoptablePetCard";

interface AdoptablePetGridProps {
  pets: any[];
  selectedGenders: {[key: string]: string};
  onGenderChange: (petId: string, gender: string) => void;
  onAdopt: (pet: any) => void;
  adopting: string | null;
  getStatColor: (stat: number) => string;
  generateGenderModifiedStats: (pet: any, gender: string) => any;
  userBalance?: number;
}

const AdoptablePetGrid = ({ 
  pets, 
  selectedGenders, 
  onGenderChange, 
  onAdopt, 
  adopting, 
  getStatColor,
  generateGenderModifiedStats,
  userBalance = 0
}: AdoptablePetGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {pets.map((pet) => {
        const selectedGender = selectedGenders[pet.id] || "Male";
        const stats = generateGenderModifiedStats(pet, selectedGender);
        const availableGenders = ['male', 'female'];
        
        return (
          <AdoptablePetCard
            key={pet.id}
            pet={pet}
            selectedGender={selectedGender}
            onGenderChange={onGenderChange}
            onAdopt={onAdopt}
            stats={stats}
            availableGenders={availableGenders}
            userBalance={userBalance}
          />
        );
      })}
    </div>
  );
};

export default AdoptablePetGrid;
