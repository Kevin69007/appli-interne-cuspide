
import { useParams } from "react-router-dom";
import { usePetProfileByNumber } from "@/hooks/usePetProfileByNumber";
import PetProfilePageLayout from "@/components/pet-profile-page/PetProfilePageLayout";
import PetProfilePageLoading from "@/components/pet-profile-page/PetProfilePageLoading";

const PetProfilePage = () => {
  const { petNumber } = useParams();
  
  console.log('🔍 PetProfilePage - petNumber from params:', petNumber);
  
  const { pet, owner, loading, error, isShelterPet, refetch } = usePetProfileByNumber(petNumber);

  console.log('🔍 PetProfilePage - hook results:', { pet, owner, loading, error, isShelterPet });

  if (loading) {
    return <PetProfilePageLoading />;
  }

  if (error || !pet) {
    console.error('🔍 PetProfilePage - Error or no pet found:', { error, pet });
    return <PetProfilePageLoading error={error} />;
  }

  return (
    <PetProfilePageLayout 
      pet={pet}
      owner={owner}
      isShelterPet={isShelterPet}
      onUpdate={refetch}
    />
  );
};

export default PetProfilePage;
