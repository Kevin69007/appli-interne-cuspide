
import { useAuth } from "@/contexts/AuthContext";
import { checkIfUsersFriends } from "@/utils/friendshipHelpers";
import { useState, useEffect } from "react";
import FeedAllPetsButton from "@/components/FeedAllPetsButton";
import WaterAllPetsButton from "@/components/WaterAllPetsButton";
import FeedAllOtherUserPetsButton from "@/components/pets/FeedAllOtherUserPetsButton";
import WaterAllOtherUserPetsButton from "@/components/pets/WaterAllOtherUserPetsButton";

interface PetsHeaderProps {
  username?: string;
  petCount: number;
  foodBags?: number;
  onUpdate: () => void;
  isOwnProfile: boolean;
  targetProfile?: any;
  userProfile?: any;
}

const PetsHeader = ({ 
  username, 
  petCount, 
  foodBags, 
  onUpdate, 
  isOwnProfile,
  targetProfile,
  userProfile
}: PetsHeaderProps) => {
  const { user } = useAuth();
  const [areFriends, setAreFriends] = useState<boolean>(false);
  const [friendshipChecked, setFriendshipChecked] = useState<boolean>(false);

  // Check friendship status when viewing other user's profile
  useEffect(() => {
    const checkFriendship = async () => {
      if (!isOwnProfile && user?.id && targetProfile?.id) {
        const friendStatus = await checkIfUsersFriends(user.id, targetProfile.id);
        setAreFriends(friendStatus);
      }
      setFriendshipChecked(true);
    };

    checkFriendship();
  }, [isOwnProfile, user?.id, targetProfile?.id]);

  // Check if current user can perform bulk actions based on privacy settings
  const canPerformBulkActions = () => {
    if (isOwnProfile) return true;
    if (!friendshipChecked || !user?.id) return false;
    
    const feedingPrivacy = targetProfile?.feeding_privacy || 'user_only';
    
    switch (feedingPrivacy) {
      case 'user_only':
        return false;
      case 'friends_only':
        return areFriends;
      case 'everyone':
        return true;
      default:
        return false;
    }
  };

  const shouldShowBulkActions = canPerformBulkActions() && petCount > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-pink-800">
          {isOwnProfile ? `${username || "Your"}'s Pets (${petCount})` : `${username || "User"}'s Pets (${petCount})`}
        </h2>
      </div>

      {/* Bulk Action Buttons and Food Bags */}
      {shouldShowBulkActions && (
        <div className="flex items-center gap-3 flex-wrap">
          {isOwnProfile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-medium text-amber-700">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Food Bags: {foodBags || 0}</span>
            </div>
          )}
          
          {isOwnProfile ? (
            <>
              <FeedAllPetsButton onFeedComplete={onUpdate} />
              <WaterAllPetsButton onWaterComplete={onUpdate} />
            </>
          ) : (
            <>
              <FeedAllOtherUserPetsButton 
                targetProfile={targetProfile}
                userProfile={userProfile}
                onComplete={onUpdate}
              />
              <WaterAllOtherUserPetsButton 
                targetProfile={targetProfile}
                userProfile={userProfile}
                onComplete={onUpdate}
              />
            </>
          )}
        </div>
      )}

      {/* Privacy notice for other users */}
      {!isOwnProfile && !shouldShowBulkActions && friendshipChecked && user?.id && (
        <div className="text-xs text-gray-500">
          {targetProfile?.feeding_privacy === 'user_only' && "Owner only allows themselves to feed their pets"}
          {targetProfile?.feeding_privacy === 'friends_only' && !areFriends && "Owner only allows friends to feed their pets"}
        </div>
      )}
    </div>
  );
};

export default PetsHeader;
