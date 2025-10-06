import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useUserProfileData = (username: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [userPets, setUserPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingFriendStatus, setCheckingFriendStatus] = useState(true);

  const isOwnProfile = useMemo(() => 
    user && profile && user.id === profile.id, 
    [user?.id, profile?.id]
  );

  const validateUsername = (username: string): boolean => {
    // Basic username validation
    if (!username || typeof username !== 'string') return false;
    if (username.trim() === '' || username.length > 50) return false;
    // Only allow letters and numbers
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(username.trim());
  };

  const checkFriendStatus = useCallback(async () => {
    if (!user || !profile || isOwnProfile) {
      setCheckingFriendStatus(false);
      return;
    }

    try {
      console.log('🔍 Checking friend status between:', user.id, 'and', profile.id);
      
      // Check if already friends
      const { data: friendshipData, error: friendshipError } = await supabase
        .from("friendships")
        .select("id")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`)
        .maybeSingle();

      if (friendshipError) {
        console.error('❌ Error checking friendship:', friendshipError);
      } else {
        console.log('✅ Friendship check result:', friendshipData);
        setIsAlreadyFriend(!!friendshipData);
      }

      // Check for pending requests
      const { data: requestData, error: requestError } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("sender_id", user.id)
        .eq("receiver_id", profile.id)
        .eq("status", "pending")
        .maybeSingle();

      if (requestError) {
        console.error('❌ Error checking friend requests:', requestError);
      } else {
        console.log('✅ Friend request check result:', requestData);
        setHasPendingRequest(!!requestData);
      }
    } catch (error) {
      console.error("❌ Error checking friend status:", error);
    } finally {
      setCheckingFriendStatus(false);
    }
  }, [user?.id, profile?.id, isOwnProfile]);

  const handleSendFriendRequest = async () => {
    if (!user || !profile || isOwnProfile) return;

    try {
      console.log('📤 Sending friend request from', user.id, 'to', profile.id);
      
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          sender_id: user.id,
          receiver_id: profile.id,
        });

      if (error) {
        console.error('❌ Error sending friend request:', error);
        toast({
          title: "Error",
          description: "Failed to send friend request",
          variant: "destructive",
        });
      } else {
        console.log('✅ Friend request sent successfully');
        toast({
          title: "Success",
          description: "Friend request sent!",
        });
        setHasPendingRequest(true);
      }
    } catch (error) {
      console.error('❌ Exception sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const fetchUserProfile = useCallback(async () => {
    if (!username) {
      console.log('❌ No username provided');
      setError("No username provided");
      setLoading(false);
      return;
    }

    const trimmedUsername = username.trim();

    // Validate username format
    if (!validateUsername(trimmedUsername)) {
      console.log('❌ Invalid username format:', trimmedUsername);
      setError("Invalid username format. Username can only contain letters and numbers.");
      setLoading(false);
      return;
    }

    console.log("🔍 Fetching profile for username:", trimmedUsername);
    setLoading(true);
    setError(null);
    setProfile(null);
    setUserPets([]);

    try {
      // Fetch the specific profile by username with case-insensitive search
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", trimmedUsername)
        .maybeSingle();

      console.log("📋 Profile query result:", { profileData, profileError, username: trimmedUsername });

      if (profileError) {
        console.error("❌ Database error fetching profile:", profileError);
        setError(`Database error: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.log("❌ No profile found for username:", trimmedUsername);
        setError(`User "${trimmedUsername}" not found. Please check the username and try again.`);
        setLoading(false);
        return;
      }

      // Verify the username matches exactly (case-insensitive)
      if (profileData.username?.toLowerCase() !== trimmedUsername.toLowerCase()) {
        console.log("❌ Username case mismatch:", profileData.username, "vs", trimmedUsername);
        setError(`User "${trimmedUsername}" not found. Please check the username and try again.`);
        setLoading(false);
        return;
      }

      console.log("✅ Profile found successfully:", {
        id: profileData.id,
        username: profileData.username,
        isCurrentUser: user?.id === profileData.id
      });
      
      setProfile(profileData);

      // Fetch user pets if profile exists
      console.log("🐾 Fetching pets for user:", profileData.id);
      const { data: petsData, error: petsError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (name, type, image_url)
        `)
        .eq("user_id", profileData.id);

      if (petsError) {
        console.error("❌ Error fetching pets:", petsError);
        // Don't fail the whole profile load for pet errors
        setUserPets([]);
      } else {
        console.log("✅ Pets found:", petsData?.length || 0, "pets");
        // Update hunger based on time passed since last_fed
        const updatedPets = petsData?.map(pet => {
          if (pet.last_fed) {
            const timePassed = Date.now() - new Date(pet.last_fed).getTime();
            const hoursPassedSinceFeeding = timePassed / (1000 * 60 * 60);
            const hungerDecrease = Math.floor(hoursPassedSinceFeeding / 12) * 20;
            const newHunger = Math.max(0, pet.hunger - hungerDecrease);
            
            return { ...pet, hunger: newHunger };
          }
          return pet;
        }) || [];

        setUserPets(updatedPets);
      }
    } catch (error) {
      console.error("❌ Unexpected error fetching profile:", error);
      setError(`Failed to load profile. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [username, user?.id]);

  useEffect(() => {
    if (username) {
      console.log('🔄 Username changed, fetching profile for:', username);
      fetchUserProfile();
    } else {
      console.log('❌ No username in effect');
      setLoading(false);
      setError("No username provided");
    }
  }, [username, fetchUserProfile]);

  useEffect(() => {
    if (user && profile && !isOwnProfile) {
      console.log('👥 Checking friend status for non-own profile');
      checkFriendStatus();
    } else {
      console.log('⏭️ Skipping friend status check:', {
        hasUser: !!user,
        hasProfile: !!profile,
        isOwnProfile
      });
      setCheckingFriendStatus(false);
    }
  }, [user, profile, isOwnProfile, checkFriendStatus]);

  return {
    profile,
    userPets,
    loading,
    error,
    isAlreadyFriend,
    hasPendingRequest,
    checkingFriendStatus,
    isOwnProfile,
    user,
    handleSendFriendRequest,
    fetchUserProfile
  };
};
