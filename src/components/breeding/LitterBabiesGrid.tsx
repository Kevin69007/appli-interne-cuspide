
import BabyPetCard from "./BabyPetCard";

interface LitterBabiesGridProps {
  babies: any[];
  onAdoptBaby: (baby: any) => void;
  userCanAdopt: boolean;
  onBabyNameClick: (baby: any) => void;
  isPublicView?: boolean;
}

const LitterBabiesGrid = ({ 
  babies, 
  onAdoptBaby, 
  userCanAdopt, 
  onBabyNameClick,
  isPublicView = false 
}: LitterBabiesGridProps) => {
  if (!babies || babies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No babies in this litter yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {babies.map((baby) => (
        <BabyPetCard
          key={baby.id}
          baby={baby}
          onAdopt={() => onAdoptBaby(baby)}
          canAdopt={userCanAdopt && !isPublicView}
          onNameClick={() => onBabyNameClick(baby)}
          isPublicView={isPublicView}
        />
      ))}
    </div>
  );
};

export default LitterBabiesGrid;
