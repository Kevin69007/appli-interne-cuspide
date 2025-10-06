
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import PetSelection from "@/components/PetSelection";
import ProfileLayout from "@/components/profile/ProfileLayout";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pets");
  const { role } = useUserRole();
  const {
    profile,
    userPets,
    loading,
    hasFirstPet,
    authLoading,
    user,
    fetchProfileData
  } = useProfile();

  const isOwnProfile = true;
  const isAdmin = role === 'admin';

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Profile - User not authenticated, redirecting to home");
      navigate("/", { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  const handlePetAdopted = () => {
    console.log("Profile - Pet adopted, refreshing profile data");
    fetchProfileData();
  };

  // If no user and auth is done loading, don't render anything (redirect will happen)
  if (!authLoading && !user) {
    return null;
  }

  // Show loading while we determine if user has pets
  if (loading || authLoading) {
    return (
      <ProfileLayout>
        <div className="loading-container">
          <PageSkeleton />
        </div>
      </ProfileLayout>
    );
  }

  // If user doesn't have a first pet, show pet selection
  if (hasFirstPet === false) {
    console.log("Profile - Showing pet selection");
    return <PetSelection onPetAdopted={handlePetAdopted} />;
  }

  // Show main profile page
  console.log("Profile - Rendering main profile page");
  return (
    <ProfileLayout>
      <div className="space-y-6">
        {profile && (
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            onProfileUpdate={fetchProfileData}
          />
        )}

        {profile && (
          <ProfileTabs
            profile={profile}
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onUpdate={fetchProfileData}
          />
        )}
      </div>
    </ProfileLayout>
  );
};

export default Profile;
