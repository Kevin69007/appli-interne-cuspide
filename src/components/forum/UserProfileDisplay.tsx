
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import XPLevelBadge from "@/components/profile/XPLevelBadge";
import PawClubBadge from "@/components/PawClubBadge";
import { Link } from "react-router-dom";

interface UserProfileDisplayProps {
  profile: any;
  showLink?: boolean;
}

const UserProfileDisplay = ({ profile, showLink = true }: UserProfileDisplayProps) => {
  const content = (
    <div className="flex items-center gap-2">
      <Avatar className="w-8 h-8">
        <AvatarImage src={profile?.profile_image_url} />
        <AvatarFallback className="bg-pink-100 text-pink-800 text-xs">
          {profile?.username?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-medium text-sm">{profile?.username || "Unknown User"}</span>
          <div className="flex items-center gap-0">
            <XPLevelBadge xp={profile?.xp || 0} className="text-xs px-0.5 py-0.5" />
            {profile?.pawclub_member && <PawClubBadge className="text-xs px-0.5 py-0.5 -ml-0.5" iconOnly />}
          </div>
        </div>
      </div>
    </div>
  );

  if (showLink && profile?.username && profile.username !== "Unknown User") {
    return (
      <Link 
        to={`/profile/${encodeURIComponent(profile.username)}`} 
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default UserProfileDisplay;
