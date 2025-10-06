
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  profile_image_url?: string;
  profile_description_short?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend?: Profile;
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data: friendshipsData, error: friendshipsError } = await supabase
      .from("friendships")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (friendshipsError) {
      console.error("Error fetching friendships:", friendshipsError);
      setFriends([]);
      return;
    }

    if (!friendshipsData || friendshipsData.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = friendshipsData.map(friendship =>
      friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id
    );

    let profilesData: any[] = [];
    if (friendIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, profile_image_url, profile_description_short")
        .in("id", friendIds);

      if (profilesError) {
        console.error("Error fetching friend profiles:", profilesError);
        setFriends([]);
        return;
      }
      profilesData = profiles ?? [];
    }

    const friendsWithProfiles = friendshipsData.map(friendship => {
      const friendId = friendship.user1_id === user.id ? friendship.user2_id : friendship.user1_id;
      const friendProfile = profilesData.find(profile => profile.id === friendId);

      return {
        ...friendship,
        friend: friendProfile
      };
    });

    setFriends(friendsWithProfiles);
  };

  const fetchFriendRequests = async () => {
    if (!user) return;

    // Fetch sent requests
    const { data: sentData, error: sentError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("sender_id", user.id)
      .eq("status", "pending");

    if (sentError) {
      console.error("Error fetching sent requests:", sentError);
    } else if (sentData) {
      const receiverIds = sentData.map(req => req.receiver_id);
      if (receiverIds.length > 0) {
        const { data: receiverProfiles } = await supabase
          .from("profiles")
          .select("id, username, profile_image_url, profile_description_short")
          .in("id", receiverIds);

        const sentWithProfiles = sentData.map(request => ({
          ...request,
          receiver: receiverProfiles?.find(profile => profile.id === request.receiver_id)
        }));
        setSentRequests(sentWithProfiles);
      } else {
        setSentRequests([]);
      }
    }

    // Fetch received requests
    const { data: receivedData, error: receivedError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("receiver_id", user.id)
      .eq("status", "pending");

    if (receivedError) {
      console.error("Error fetching received requests:", receivedError);
    } else if (receivedData) {
      const senderIds = receivedData.map(req => req.sender_id);
      if (senderIds.length > 0) {
        const { data: senderProfiles } = await supabase
          .from("profiles")
          .select("id, username, profile_image_url, profile_description_short")
          .in("id", senderIds);

        const receivedWithProfiles = receivedData.map(request => ({
          ...request,
          sender: senderProfiles?.find(profile => profile.id === request.sender_id)
        }));
        setReceivedRequests(receivedWithProfiles);
      } else {
        setReceivedRequests([]);
      }
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("friend_requests")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
      return false;
    } else {
      toast({
        title: "Success",
        description: "Friend request sent!",
      });
      fetchFriendRequests();
      return true;
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      console.log("🤝 useFriends: Accepting friend request:", requestId);

      // Use the database function for accepting friend requests
      const { error } = await supabase.rpc("accept_friend_request", {
        request_id_param: requestId,
      });

      if (error) {
        console.error("❌ useFriends: Error accepting friend request:", error);
        toast({
          title: "Error",
          description: `Failed to accept friend request: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      console.log("✅ useFriends: Friend request accepted successfully");
      toast({
        title: "Success",
        description: "Friend request accepted!",
      });

      // Fetch updated data with error handling
      try {
        console.log("🔄 useFriends: Refreshing friends and requests data");
        await Promise.all([fetchFriends(), fetchFriendRequests()]);
        console.log("✅ useFriends: Data refresh completed");
      } catch (refreshError) {
        console.error("❌ useFriends: Error refreshing data after accept:", refreshError);
        // Still return success since the accept operation succeeded
      }
      
      return true;
    } catch (error: any) {
      console.error("❌ useFriends: Unexpected error accepting friend request:", error);
      toast({
        title: "Error",
        description: `Failed to accept friend request: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Friend request declined",
      });
      fetchFriendRequests();
    }
  };

  const cancelFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Friend request cancelled",
      });
      fetchFriendRequests();
    }
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Friend removed",
      });
      fetchFriends();
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user]);

  return {
    friends,
    sentRequests,
    receivedRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    fetchFriends,
    fetchFriendRequests
  };
};
