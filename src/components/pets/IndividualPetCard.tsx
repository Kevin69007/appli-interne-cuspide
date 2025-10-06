
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, DollarSign } from "lucide-react";
import { getGenderIcon, getGenderColor } from "@/utils/petHelpers";
import PetStatsDisplay from "./PetStatsDisplay";
import PetCardActions from "./PetCardActions";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { checkIfUsersFriends } from "@/utils/friendshipHelpers";

interface IndividualPetCardProps {
  pet: any;
  profile: any;
  isBreeding: boolean;
  petSaleInfo: any;
  onFeed: () => Promise<void>;
  onWater: () => Promise<void>;
  onStatsClick: () => void;
  onProfileClick: () => void;
  onBreedingClick: () => void;
  onPurchaseClick?: () => void;
  isOwnProfile?: boolean;
  userProfile?: any;
  isFeedingInProgress?: boolean;
  isWateringInProgress?: boolean;
}

const IndividualPetCard = ({
  pet,
  profile,
  isBreeding,
  petSaleInfo,
  onFeed,
  onWater,
  onStatsClick,
  onProfileClick,
  onBreedingClick,
  onPurchaseClick,
  isOwnProfile = true,
  userProfile,
  isFeedingInProgress = false,
  isWateringInProgress = false
}: IndividualPetCardProps) => {
  const { user } = useAuth();
  const [areFriends, setAreFriends] = useState<boolean>(false);
  const [friendshipChecked, setFriendshipChecked] = useState<boolean>(false);
  
  const isForSale = petSaleInfo && petSaleInfo.is_active;
  
  // Check if current user owns this pet by comparing profile IDs
  const isOwnPet = (userProfile?.id ?? user?.id) === pet.user_id;

  // Check friendship status when not own profile
  useEffect(() => {
    const checkFriendship = async () => {
      if (!isOwnProfile && user?.id && profile?.id) {
        const friendStatus = await checkIfUsersFriends(user.id, profile.id);
        setAreFriends(friendStatus);
      }
      setFriendshipChecked(true);
    };

    checkFriendship();
  }, [isOwnProfile, user?.id, profile?.id]);

  // Check if current user can feed/water this pet based on owner's privacy settings
  const canInteractWithPet = () => {
    if (isOwnProfile) return true;
    if (!friendshipChecked) return false;
    
    const feedingPrivacy = profile?.feeding_privacy || 'user_only';
    
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

  const shouldShowPetActions = user?.id && (isOwnProfile || canInteractWithPet());
  const canUserInteract = canInteractWithPet();

  const handleSaleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwnPet) return;
    
    if (onPurchaseClick) {
      onPurchaseClick();
    }
  };

  // Check if breed name is long enough to wrap
  const breedName = pet.breed || pet.pets.name;
  const isLongBreed = breedName.length > 20;

  return (
    <Card className="border-pink-200 shadow-lg hover:shadow-xl transition-shadow relative">
      {/* Sale price tag for pets that are for sale - only show to non-owners */}
      {isForSale && !isOwnPet && (
        <div 
          className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md z-10 cursor-pointer hover:bg-green-600 transition-colors text-xs font-bold"
          onClick={handleSaleIconClick}
          title={`Buy for ${petSaleInfo.price_nd} PD`}
        >
          {petSaleInfo.price_nd} PD
        </div>
      )}

      {/* Sale price tag for pet owners - show but not clickable */}
      {isForSale && isOwnPet && (
        <div 
          className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md z-10 text-xs font-bold"
          title="Pet for sale"
        >
          {petSaleInfo.price_nd} PD
        </div>
      )}

      {isBreeding && isOwnProfile && (
        <div 
          className="absolute top-8 right-2 bg-pink-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-pink-600 transition-colors z-10"
          onClick={onBreedingClick}
          title="Breeding in progress"
        >
          <Heart className="w-3 h-3" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <PetImageDisplay
              pet={pet}
              alt={pet.pet_name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <CardTitle className="text-pink-800 text-sm truncate">
                {pet.pet_name}
              </CardTitle>
              {pet.gender && (
                <span className={`text-sm font-bold ${getGenderColor(pet.gender)} flex-shrink-0`}>
                  {getGenderIcon(pet.gender)}
                </span>
              )}
            </div>
            <p className={`text-xs text-gray-600 capitalize leading-tight break-words ${isLongBreed ? 'mb-1' : 'mb-3'}`}>
              {breedName}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={onProfileClick}
              className="text-pink-600 hover:text-pink-700 p-0 h-auto text-xs shadow-none"
            >
              View Profile
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <PetStatsDisplay 
          pet={pet} 
          isFeeding={isFeedingInProgress}
          isWatering={isWateringInProgress}
        />
        
        {/* Show pet actions when appropriate */}
        {shouldShowPetActions && (
          <div>
            {!isOwnProfile && !canUserInteract && friendshipChecked && (
              <p className="text-xs text-gray-500 mb-2">
                {profile?.feeding_privacy === 'user_only' && "Owner only allows themselves to feed their pets"}
                {profile?.feeding_privacy === 'friends_only' && !areFriends && "Owner only allows friends to feed their pets"}
              </p>
            )}
            <PetCardActions
              pet={pet}
              isOwnProfile={isOwnProfile}
              targetUserId={isOwnProfile ? undefined : profile?.id}
              showButtons={canUserInteract || isOwnProfile}
              onFeed={onFeed}
              onWater={onWater}
              isFeedingInProgress={isFeedingInProgress}
              isWateringInProgress={isWateringInProgress}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IndividualPetCard;
