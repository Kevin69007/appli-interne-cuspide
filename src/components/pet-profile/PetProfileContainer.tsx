
import { useParams } from "react-router-dom";
import { usePetProfile } from "@/hooks/usePetProfile";
import { useAuth } from "@/contexts/AuthContext";
import PetProfileLoading from "./PetProfileLoading";
import PetProfileLayout from "./PetProfileLayout";

const PetProfileContainer = () => {
  const { petId } = useParams();
  const { user } = useAuth();
  const { pet, loading, parents, fetchPetDetails } = usePetProfile(petId);

  // Show loading or error states
  const loadingComponent = PetProfileLoading({ loading, pet });
  if (loadingComponent) return loadingComponent;

  // Check if this is the user's own pet
  const isOwnProfile = user?.id === pet?.user_id;

  return (
    <PetProfileLayout 
      pet={pet}
      parents={parents}
      isOwnProfile={isOwnProfile}
      onUpdate={fetchPetDetails}
    />
  );
};

export default PetProfileContainer;
