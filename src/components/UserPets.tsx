
import { useState, useEffect } from "react";
import UserAboutSection from "@/components/profile/UserAboutSection";
import PetsHeader from "@/components/pets/PetsHeader";
import PetModalsManager from "@/components/pets/PetModalsManager";
import PetsGrid from "@/components/pets/PetsGrid";
import { useUserPetsData } from "@/hooks/useUserPetsData";
import { useAuth } from "@/contexts/AuthContext";

interface UserPetsProps {
  profile?: any;
  onUpdate?: () => void;
  isOwnProfile?: boolean;
  profileUserId?: string;
  targetUserId?: string; // Add this missing prop
}

const UserPets = ({ profile: propProfile, onUpdate: propOnUpdate, isOwnProfile = true, profileUserId, targetUserId }: UserPetsProps = {}) => {
  const { user } = useAuth();
  const [modalPet, setModalPet] = useState<any>(null);
  const [statsModalPet, setStatsModalPet] = useState<any>(null);
  const [profileModalPet, setProfileModalPet] = useState<any>(null);

  // Use targetUserId if provided, otherwise fall back to profileUserId
  const actualTargetUserId = targetUserId || profileUserId;

  const {
    profile,
    userPets,
    userProfile,
    loading,
    handleUpdate
  } = useUserPetsData({
    targetUserId: actualTargetUserId,
    isOwnProfile,
    propProfile,
    propOnUpdate
  });

  // Reduced refresh frequency to prevent constant re-loading
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log("🔄 UserPets: Periodic refresh for natural stat decay");
      handleUpdate();
    }, 10 * 60 * 1000); // Refresh every 10 minutes instead of 5 to reduce load

    return () => clearInterval(intervalId);
  }, [handleUpdate]);

  // Listen for specific events that require pet list updates
  useEffect(() => {
    const handleShelterUpdate = () => {
      console.log("🔄 UserPets: Received shelter update event, refreshing pets...");
      handleUpdate();
    };

    const handleBreedingUpdate = () => {
      console.log("🔄 UserPets: Received breeding update event, refreshing pets...");
      handleUpdate();
    };

    // Listen only for events that actually change the pet list
    window.addEventListener('shelter-update', handleShelterUpdate);
    window.addEventListener('breeding-update', handleBreedingUpdate);
    window.addEventListener('breeding-complete', handleBreedingUpdate);
    window.addEventListener('litter-collected', handleBreedingUpdate);

    return () => {
      window.removeEventListener('shelter-update', handleShelterUpdate);
      window.removeEventListener('breeding-update', handleBreedingUpdate);
      window.removeEventListener('breeding-complete', handleBreedingUpdate);
      window.removeEventListener('litter-collected', handleBreedingUpdate);
    };
  }, [handleUpdate]);

  return (
    <div className="space-y-6">
      <PetsHeader
        username={profile?.username}
        petCount={userPets.length}
        foodBags={profile?.food_bags}
        onUpdate={handleUpdate}
        isOwnProfile={isOwnProfile}
        targetProfile={profile}
        userProfile={userProfile}
      />

      <PetsGrid
        userPets={userPets}
        profile={profile}
        userProfile={userProfile}
        isOwnProfile={isOwnProfile}
        onUpdate={handleUpdate}
        onStatsClick={setStatsModalPet}
        onProfileClick={setProfileModalPet}
      />

      {/* About Me Section - show for all users */}
      <UserAboutSection 
        profile={profile} 
        isOwnProfile={isOwnProfile} 
        onUpdate={handleUpdate} 
      />

      {/* Pet Modals - show for all users (both own and other users can view pet stats and profiles) */}
      <PetModalsManager
        modalPet={modalPet}
        statsModalPet={statsModalPet}
        profileModalPet={profileModalPet}
        onCloseModal={() => setModalPet(null)}
        onCloseStatsModal={() => setStatsModalPet(null)}
        onCloseProfileModal={() => setProfileModalPet(null)}
        onUpdate={handleUpdate}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default UserPets;
