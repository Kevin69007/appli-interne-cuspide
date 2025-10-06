
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  profile_image_url?: string;
  profile_description_short?: string;
}

interface SearchUserCardProps {
  profile: Profile;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
  onSendFriendRequest: (profileId: string) => void;
}

const SearchUserCard = ({ profile, isAlreadyFriend, hasPendingRequest, onSendFriendRequest }: SearchUserCardProps) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (profile.username) {
      console.log("Navigating to profile:", profile.username);
      navigate(`/profile/${profile.username}`);
    } else {
      console.error("No username found for profile:", profile);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          >
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.username}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-pink-600 font-medium ${profile.profile_image_url ? 'hidden' : ''}`}>
              {profile.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <CardTitle 
              className="text-lg cursor-pointer hover:text-pink-700 transition-colors"
              onClick={handleProfileClick}
            >
              {profile.username || 'Unknown User'}
            </CardTitle>
            <CardDescription>
              {profile.profile_description_short || "No description"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button
            onClick={handleProfileClick}
            variant="outline"
            className="w-full"
          >
            <User className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          
          {isAlreadyFriend ? (
            <Badge variant="secondary" className="w-full justify-center">
              Already Friends
            </Badge>
          ) : hasPendingRequest ? (
            <Badge variant="outline" className="w-full justify-center">
              Request Sent
            </Badge>
          ) : (
            <Button
              onClick={() => onSendFriendRequest(profile.id)}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Send Friend Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchUserCard;
