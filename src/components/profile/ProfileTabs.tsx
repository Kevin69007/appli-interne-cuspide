
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserPets from "@/components/UserPets";
import MessageBoard from "@/components/MessageBoard";
import LedgerTab from "./LedgerTab";
import Friends from "@/components/Friends";

interface ProfileTabsProps {
  profile: any;
  isOwnProfile: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUpdate: () => void;
}

const ProfileTabs = ({ profile, isOwnProfile, activeTab, onTabChange, onUpdate }: ProfileTabsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  console.log("ProfileTabs rendering with activeTab:", activeTab);
  
  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['pets', 'friends', 'messages', 'ledger'].includes(tabParam)) {
      onTabChange(tabParam);
      // Clear the URL parameter after setting the tab
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('tab');
        return newParams;
      });
    }
  }, [searchParams, onTabChange, setSearchParams]);
  
  // Check if messages should be visible based on privacy settings
  const shouldShowMessages = isOwnProfile || profile?.message_privacy === 'everyone';
  
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full bg-white/90 backdrop-blur-sm border border-pink-200" style={{ gridTemplateColumns: `repeat(${2 + (shouldShowMessages ? 1 : 0) + (isOwnProfile ? 1 : 0)}, 1fr)` }}>
        <TabsTrigger value="pets" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
          Pets
        </TabsTrigger>
        <TabsTrigger value="friends" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
          Friends
        </TabsTrigger>
        {shouldShowMessages && (
          <TabsTrigger value="messages" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            Messages
          </TabsTrigger>
        )}
        {isOwnProfile && (
          <TabsTrigger value="ledger" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800">
            Ledger
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="pets" className="mt-6">
        <UserPets 
          profileUserId={profile?.id} 
          isOwnProfile={isOwnProfile} 
          onUpdate={onUpdate}
          profile={profile}
        />
      </TabsContent>

      <TabsContent value="friends" className="mt-6">
        <Friends targetUserId={profile?.id} isOwnProfile={isOwnProfile} />
      </TabsContent>

      {shouldShowMessages && (
        <TabsContent value="messages" className="mt-6">
          <MessageBoard 
            profileUserId={profile?.id} 
            isOwnProfile={isOwnProfile}
          />
        </TabsContent>
      )}

      {isOwnProfile && (
        <TabsContent value="ledger" className="mt-6">
          <LedgerTab />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default ProfileTabs;
