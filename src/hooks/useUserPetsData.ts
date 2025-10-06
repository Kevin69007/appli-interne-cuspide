
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "./useUserPetsData/useCurrentUserProfile";
import { useTargetProfile } from "./useUserPetsData/useTargetProfile";
import { usePetsFetching } from "./useUserPetsData/usePetsFetching";
import type { UseUserPetsDataProps, UseUserPetsDataReturn } from "./useUserPetsData/types";

export const useUserPetsData = ({
  targetUserId,
  isOwnProfile = true,
  propProfile,
  propOnUpdate
}: UseUserPetsDataProps): UseUserPetsDataReturn => {
  const { user } = useAuth();
  const { userProfile, setUserProfile, fetchCurrentUserProfile } = useCurrentUserProfile();
  const { profile, setProfile, fetchProfile } = useTargetProfile();
  const { userPets, loading, fetchUserPets } = usePetsFetching();

  const actualTargetUserId = targetUserId || user?.id;

  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
    }
  }, [propProfile, setProfile]);

  useEffect(() => {
    if (actualTargetUserId) {
      fetchUserPets(actualTargetUserId);
      if (!propProfile) {
        fetchProfile(actualTargetUserId);
      }
    }
    
    // Always fetch current user's profile when viewing other profiles
    if (user?.id && !isOwnProfile) {
      fetchCurrentUserProfile();
    }
  }, [actualTargetUserId, propProfile, user?.id, isOwnProfile]);

  const handleUpdate = () => {
    if (actualTargetUserId) {
      fetchUserPets(actualTargetUserId);
    }
    if (!propProfile && actualTargetUserId) {
      fetchProfile(actualTargetUserId);
    }
    if (!isOwnProfile) {
      fetchCurrentUserProfile();
    }
    // Only call propOnUpdate for own profiles to prevent page-wide refreshes on other users' profiles
    if (propOnUpdate && isOwnProfile) {
      propOnUpdate();
    }
  };

  return {
    profile,
    userPets,
    userProfile,
    loading,
    handleUpdate,
    fetchUserPets: () => actualTargetUserId ? fetchUserPets(actualTargetUserId) : Promise.resolve()
  };
};
