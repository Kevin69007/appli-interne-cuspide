
export interface UseUserPetsDataProps {
  targetUserId?: string;
  isOwnProfile?: boolean;
  propProfile?: any;
  propOnUpdate?: () => void;
}

export interface UseUserPetsDataReturn {
  profile: any;
  userPets: any[];
  userProfile: any;
  loading: boolean;
  handleUpdate: () => void;
  fetchUserPets: () => Promise<void>;
}
