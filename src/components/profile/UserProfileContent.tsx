
import { useState } from "react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";

interface UserProfileContentProps {
  profile: any;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
}

const UserProfileContent = ({ profile, isOwnProfile, onProfileUpdate }: UserProfileContentProps) => {
  const [activeTab, setActiveTab] = useState("pets");

  const handleTabChange = (tab: string) => {
    console.log("UserProfile - Tab changed to:", tab);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={onProfileUpdate}
      />

      <ProfileTabs
        profile={profile}
        isOwnProfile={isOwnProfile}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onUpdate={onProfileUpdate}
      />
    </div>
  );
};

export default UserProfileContent;
