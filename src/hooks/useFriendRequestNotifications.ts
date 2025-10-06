import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Global state for friend request notifications (singleton pattern)
let globalPendingRequestsCount = 0;
let globalHasPendingRequests = false;
let subscribers: ((count: number, hasPending: boolean) => void)[] = [];
let currentUserId: string | null = null;
let supabaseChannel: any = null;

const notifySubscribers = (count: number, hasPending: boolean) => {
  globalPendingRequestsCount = count;
  globalHasPendingRequests = hasPending;
  subscribers.forEach(callback => callback(count, hasPending));
};

const checkPendingRequests = async (userId: string) => {
  if (!userId) return;

  try {
    const { count, error } = await supabase
      .from("friend_requests")
      .select("*", { count: 'exact', head: true })
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (error) {
      console.error("Error checking pending friend requests:", error);
      return;
    }

    const requestCount = count || 0;
    const hasPending = requestCount > 0;
    notifySubscribers(requestCount, hasPending);
  } catch (error) {
    console.error("Error checking pending friend requests:", error);
  }
};

const setupSubscription = (userId: string) => {
  if (supabaseChannel || !userId) return;

  console.log("Setting up friend request notifications subscription for user:", userId);
  
  supabaseChannel = supabase
    .channel('friend-request-notifications')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => {
        console.log("Friend request change detected:", payload);
        checkPendingRequests(userId);
      }
    )
    .subscribe();
};

const cleanupSubscription = () => {
  if (supabaseChannel) {
    console.log("Cleaning up friend request notifications subscription");
    supabase.removeChannel(supabaseChannel);
    supabaseChannel = null;
  }
};

export const useFriendRequestNotifications = () => {
  const { user } = useAuth();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(globalPendingRequestsCount);
  const [hasPendingRequests, setHasPendingRequests] = useState(globalHasPendingRequests);

  useEffect(() => {
    const userId = user?.id;

    if (!userId) {
      // Clean up if user logs out
      if (currentUserId) {
        cleanupSubscription();
        currentUserId = null;
        notifySubscribers(0, false);
      }
      return;
    }

    // Set up subscription if user changed or first time
    if (currentUserId !== userId) {
      cleanupSubscription();
      currentUserId = userId;
      setupSubscription(userId);
      checkPendingRequests(userId);
    }

    // Subscribe to notifications
    const callback = (count: number, hasPending: boolean) => {
      setPendingRequestsCount(count);
      setHasPendingRequests(hasPending);
    };

    subscribers.push(callback);

    // Initial check
    checkPendingRequests(userId);

    return () => {
      // Remove this component's callback
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }

      // Clean up subscription if no more subscribers
      if (subscribers.length === 0 && supabaseChannel) {
        cleanupSubscription();
        currentUserId = null;
      }
    };
  }, [user?.id]);

  const refreshPendingRequestsCount = () => {
    if (currentUserId) {
      checkPendingRequests(currentUserId);
    }
  };

  return {
    pendingRequestsCount,
    hasPendingRequests,
    refreshPendingRequestsCount
  };
};