
import XPTooltip from "@/components/ui/XPTooltip";
import CareBadge from "./CareBadge";

interface ProfileStatsProps {
  profile: any;
  isOwnProfile?: boolean;
}

const ProfileStats = ({ profile, isOwnProfile = true }: ProfileStatsProps) => {
  console.log('🔍 ProfileStats - Profile data:', {
    xp: profile?.xp,
    paw_dollars: profile?.paw_dollars,
    paw_points: profile?.paw_points,
    care_badge_days: profile?.care_badge_days,
    pawclub_member: profile?.pawclub_member
  });

  return (
    <div className="flex justify-center w-full">
      <div className={`grid gap-4 ${isOwnProfile ? 'grid-cols-2 md:grid-cols-4 max-w-4xl' : 'grid-cols-1 max-w-xs'}`}>
        <XPTooltip xp={profile?.xp || 0}>
          <div className="bg-purple-50 p-3 rounded-full text-center border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{profile?.xp || 0}</div>
            <div className="text-sm text-purple-700">XP Points</div>
          </div>
        </XPTooltip>
        {isOwnProfile && (
          <>
            <div className="bg-orange-50 p-3 rounded-full text-center border-2 border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{profile?.paw_dollars || 0}</div>
              <div className="text-sm text-orange-700">Paw Dollars</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-center border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{profile?.paw_points || 0}</div>
              <div className="text-sm text-blue-700">Paw Points</div>
            </div>
            <div className="bg-red-50 p-3 rounded-full text-center border-2 border-red-200">
              <div className="text-2xl font-bold text-red-600">{profile?.care_badge_days || 0}</div>
              <div className="text-sm text-red-700">Care Days</div>
              {profile?.care_badge_days > 0 && (
                <div className="mt-1">
                  <CareBadge careBadgeDays={profile.care_badge_days} className="text-xs" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileStats;
