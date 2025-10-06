
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import UserBlockButton from "@/components/profile/UserBlockButton";

interface UserProfileHeaderProps {
  isOwnProfile: boolean;
  user: any;
  profile: any;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
  checkingFriendStatus: boolean;
  onSendFriendRequest: () => void;
}

const UserProfileHeader = ({ 
  isOwnProfile, 
  user, 
  profile, 
  isAlreadyFriend, 
  hasPendingRequest, 
  checkingFriendStatus, 
  onSendFriendRequest 
}: UserProfileHeaderProps) => {
  const navigate = useNavigate();

  if (isOwnProfile) {
    return null;
  }

  return (
    <div className="flex justify-between items-center">
      <Button onClick={() => navigate(-1)} variant="outline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      {user && profile && (
        <div className="flex items-center gap-2">
          {!checkingFriendStatus && (
            <>
              {isAlreadyFriend ? (
                <Button variant="outline" size="sm" disabled className="text-green-600 border-green-600">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Already Friends
                </Button>
              ) : hasPendingRequest ? (
                <Button variant="outline" size="sm" disabled className="text-yellow-600 border-yellow-600">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Request Sent
                </Button>
              ) : (
                <Button 
                  onClick={onSendFriendRequest}
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              )}
            </>
          )}
          <UserBlockButton 
            targetUserId={profile.id} 
            targetUsername={profile.username || "User"} 
          />
        </div>
      )}
    </div>
  );
};

export default UserProfileHeader;
