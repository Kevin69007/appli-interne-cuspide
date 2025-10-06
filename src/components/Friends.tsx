
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Search } from "lucide-react";
import FriendCard from "@/components/friends/FriendCard";
import FriendRequestCard from "@/components/friends/FriendRequestCard";
import SearchUserCard from "@/components/friends/SearchUserCard";
import { useFriends } from "@/components/friends/useFriends";
import { useFriendRequestNotifications } from "@/hooks/useFriendRequestNotifications";

interface FriendsProps {
  targetUserId?: string;
  isOwnProfile?: boolean;
}

interface Profile {
  id: string;
  username: string;
  profile_image_url?: string;
  profile_description_short?: string;
}

interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend?: Profile;
}

const Friends = ({ targetUserId, isOwnProfile = true }: FriendsProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [targetUserFriends, setTargetUserFriends] = useState<Friendship[]>([]);

  const actualUserId = targetUserId || user?.id;
  
  // Hook for friend request notifications
  const { refreshPendingRequestsCount } = useFriendRequestNotifications();
  
  // Use the existing useFriends hook only for own profile (authenticated user)
  const {
    friends: ownFriends,
    sentRequests,
    receivedRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend: removeOwnFriend,
    fetchFriends: fetchOwnFriends,
    fetchFriendRequests
  } = useFriends();

  // Enhanced accept friend request with notification refresh
  const handleAcceptFriendRequest = async (requestId: string) => {
    console.log("🤝 Friends: Accepting friend request with notification refresh");
    
    try {
      const success = await acceptFriendRequest(requestId);
      
      if (success) {
        console.log("✅ Friends: Friend request accepted, refreshing notification count");
        // Manual refresh to ensure notification disappears immediately
        refreshPendingRequestsCount();
        
        // Additional fallback refresh after a short delay
        setTimeout(() => {
          console.log("🔄 Friends: Fallback notification refresh");
          refreshPendingRequestsCount();
        }, 1000);
      }
      
      return success;
    } catch (error) {
      console.error("❌ Friends: Error in handleAcceptFriendRequest:", error);
      // Still refresh on error to ensure UI consistency
      refreshPendingRequestsCount();
      return false;
    }
  };

  // Fetch friends for the target user (when viewing someone else's profile)
  const fetchTargetUserFriends = async () => {
    if (!targetUserId || isOwnProfile) return;

    try {
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from("friendships")
        .select("*")
        .or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);

      if (friendshipsError) {
        console.error("Error fetching target user friendships:", friendshipsError);
        return;
      }

      if (!friendshipsData || friendshipsData.length === 0) {
        setTargetUserFriends([]);
        return;
      }

      const friendIds = friendshipsData.map(friendship => 
        friendship.user1_id === targetUserId ? friendship.user2_id : friendship.user1_id
      );

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, profile_image_url, profile_description_short")
        .in("id", friendIds);

      if (profilesError) {
        console.error("Error fetching friend profiles:", profilesError);
        return;
      }

      const friendsWithProfiles = friendshipsData.map(friendship => {
        const friendId = friendship.user1_id === targetUserId ? friendship.user2_id : friendship.user1_id;
        const friendProfile = profilesData?.find(profile => profile.id === friendId);
        
        return {
          ...friendship,
          friend: friendProfile
        };
      });

      setTargetUserFriends(friendsWithProfiles);
    } catch (error) {
      console.error("Error fetching target user friends:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (actualUserId) {
        setLoading(true);
        if (isOwnProfile) {
          await fetchOwnFriends();
          await fetchFriendRequests();
        } else {
          await fetchTargetUserFriends();
        }
        setLoading(false);
      }
    };
    loadData();
  }, [actualUserId, isOwnProfile, targetUserId]);

  // Get the appropriate friends list based on whether it's own profile or not
  const friends = isOwnProfile ? ownFriends : targetUserFriends;

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) return;

    setSearching(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, profile_image_url, profile_description_short")
        .ilike("username", `%${query}%`)
        .neq("id", user.id)
        .limit(10);

      // Check friendship status for each user
      const usersWithStatus = await Promise.all((data || []).map(async (profile) => {
        const isAlreadyFriend = ownFriends.some(f => f.friend?.id === profile.id);
        const hasPendingRequest = sentRequests.some(r => r.receiver?.id === profile.id);
        
        return {
          ...profile,
          isAlreadyFriend,
          hasPendingRequest
        };
      }));

      setSearchResults(usersWithStatus);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== "search") {
      setActiveTab("search");
    }
    searchUsers(searchQuery);
  };

  const handleSearchButtonClick = () => {
    setActiveTab("search");
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    }
  };

  const handleTabChange = (tab: "friends" | "requests" | "search") => {
    setActiveTab(tab);
    if (tab === "search") {
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search Section - only show for own profile */}
      {isOwnProfile && (
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-800">
              <Search className="w-5 h-5" />
              Find Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search users by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleSearchButtonClick}
                disabled={searching || !searchQuery.trim()}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Users className="w-5 h-5" />
            {isOwnProfile ? "My Friends" : "Friends"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === "friends" ? "default" : "outline"}
              onClick={() => handleTabChange("friends")}
              size="sm"
            >
              Friends ({friends.length})
            </Button>
            {isOwnProfile && (
              <>
                <Button
                  variant={activeTab === "requests" ? "default" : "outline"}
                  onClick={() => handleTabChange("requests")}
                  size="sm"
                >
                  Requests ({receivedRequests.length})
                </Button>
                <Button
                  variant={activeTab === "search" ? "default" : "outline"}
                  onClick={() => handleTabChange("search")}
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Search Results
                </Button>
              </>
            )}
          </div>

          {activeTab === "friends" && (
            <div>
              {friends.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{isOwnProfile ? "No friends yet" : "No friends to display"}</p>
                  {isOwnProfile && (
                    <p className="text-sm text-muted-foreground">Use the search above to find and connect with other users!</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friendship) => (
                    <FriendCard 
                      key={friendship.id} 
                      friendship={friendship} 
                      onRemoveFriend={isOwnProfile ? removeOwnFriend : () => {}} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {isOwnProfile && activeTab === "requests" && (
            <div>
              {receivedRequests.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <UserPlus className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No pending friend requests</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedRequests.map((request) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      type="received"
                      onAccept={handleAcceptFriendRequest}
                      onDecline={declineFriendRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {isOwnProfile && activeTab === "search" && (
            <div className="space-y-4">
              {searching && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              )}

              <div>
                {searchResults.length === 0 && searchQuery && !searching && (
                  <div className="text-center text-muted-foreground py-8">
                    <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No users found matching "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-2">Try searching with a different username</p>
                  </div>
                )}
                {searchResults.length === 0 && !searchQuery && (
                  <div className="text-center text-muted-foreground py-8">
                    <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Use the search above to find other users</p>
                    <p className="text-sm text-muted-foreground mt-2">Enter a username to get started</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((profile) => (
                    <SearchUserCard 
                      key={profile.id} 
                      profile={profile}
                      isAlreadyFriend={profile.isAlreadyFriend}
                      hasPendingRequest={profile.hasPendingRequest}
                      onSendFriendRequest={sendFriendRequest}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Friends;
