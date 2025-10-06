
import ProfileLink from "@/components/forum/ProfileLink";

interface LitterOwnerInfoProps {
  ownerProfile: {
    username?: string;
    profile_image_url?: string;
    xp?: number;
    pawclub_member?: boolean;
  } | null;
  className?: string;
}

const LitterOwnerInfo = ({ ownerProfile, className = "" }: LitterOwnerInfoProps) => {
  if (!ownerProfile?.username) {
    return (
      <span className={`text-gray-600 ${className}`}>
        Unknown Owner
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-gray-600">Owner:</span>
      <ProfileLink 
        profile={ownerProfile}
        className="font-medium"
        showIcon={false}
      />
    </div>
  );
};

export default LitterOwnerInfo;
