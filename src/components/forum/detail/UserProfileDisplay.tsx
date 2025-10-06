
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { getXPLevel } from "@/utils/xpLevels";
import { formatTimestamp, formatReplyTime } from "@/utils/timeHelpers";
import XPLevelBadge from "@/components/profile/XPLevelBadge";
import PawClubBadge from "@/components/PawClubBadge";

interface UserProfileDisplayProps {
  profile: any;
  userId: string;
  timestamp?: string;
  isEdited?: boolean;
  editedAt?: string;
  isReply?: boolean;
}

const UserProfileDisplay = ({ profile, userId, timestamp, isEdited, editedAt, isReply = false }: UserProfileDisplayProps) => {
  const navigate = useNavigate();
  
  const handleProfileClick = () => {
    if (profile?.username && profile.username !== "Unknown User") {
      console.log('🔗 UserProfileDisplay - Navigating to profile:', profile.username);
      navigate(`/profile/${encodeURIComponent(profile.username)}`);
    } else {
      console.log('❌ UserProfileDisplay - Cannot navigate - invalid username:', profile?.username);
    }
  };
  
  return (
    <div className="flex items-start gap-4 mb-4">
      <Avatar className="w-16 h-16">
        <AvatarImage src={profile?.profile_image_url} />
        <AvatarFallback>
          {profile?.username ? profile.username.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          {profile?.username && profile.username !== "Unknown User" ? (
            <button
              className="text-pink-800 hover:text-pink-900 hover:underline font-bold text-lg bg-transparent border-none p-0 m-0 cursor-pointer transition-colors"
              onClick={handleProfileClick}
              title={`View ${profile.username}'s profile`}
            >
              {profile.username}
            </button>
          ) : (
            <p className="font-bold text-lg">Anonymous</p>
          )}
          <div className="flex items-center gap-0">
            <XPLevelBadge xp={profile?.xp || 0} className="text-xs px-0.5 py-0.5" />
            {profile?.pawclub_member && <PawClubBadge className="text-xs px-0.5 py-0.5 -ml-0.5" iconOnly />}
          </div>
        </div>
        {timestamp && (
          <div className="text-sm text-muted-foreground">
            {isReply ? formatReplyTime(timestamp) : formatTimestamp(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileDisplay;
