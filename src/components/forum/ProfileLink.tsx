
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import XPLevelBadge from "@/components/profile/XPLevelBadge";
import PawClubBadge from "@/components/PawClubBadge";

interface ProfileLinkProps {
  profile: {
    username?: string;
    profile_image_url?: string;
    xp?: number;
    pawclub_member?: boolean;
  };
  className?: string;
  showIcon?: boolean;
}

const ProfileLink = ({ profile, className = "", showIcon = true }: ProfileLinkProps) => {
  // Don't render link if no valid username
  if (!profile?.username || profile.username === "Unknown User") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && (
          <Avatar className="w-6 h-6">
            <AvatarImage src={profile?.profile_image_url} />
            <AvatarFallback className="bg-pink-100 text-pink-800 text-xs">
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
        )}
        <span className="font-medium text-pink-800">
          {profile?.username || "Unknown User"}
        </span>
        {showIcon && (
          <div className="flex items-center gap-0">
            <XPLevelBadge xp={profile?.xp || 0} className="text-xs px-1 py-0.5" />
            {profile?.pawclub_member && <PawClubBadge className="text-xs px-1 py-0.5 -ml-1" iconOnly />}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link 
      to={`/profile/${encodeURIComponent(profile.username)}`}
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      {showIcon && (
        <Avatar className="w-6 h-6">
          <AvatarImage src={profile?.profile_image_url} />
          <AvatarFallback className="bg-pink-100 text-pink-800 text-xs">
            {profile.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="font-medium text-pink-800 hover:text-pink-900">
        {profile.username}
      </span>
      {showIcon && (
        <div className="flex items-center gap-0">
          <XPLevelBadge xp={profile?.xp || 0} className="text-xs px-1 py-0.5" />
          {profile?.pawclub_member && <PawClubBadge className="text-xs px-1 py-0.5 -ml-1" iconOnly />}
        </div>
      )}
    </Link>
  );
};

export default ProfileLink;
