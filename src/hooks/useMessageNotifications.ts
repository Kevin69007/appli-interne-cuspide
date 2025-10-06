
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Singleton pattern to ensure only one subscription
let globalUnreadCount = 0;
let globalHasUnreadMessages = false;
let subscribers: ((count: number, hasUnread: boolean) => void)[] = [];
let activeChannel: any = null;
let currentUserId: string | null = null;

const notifySubscribers = (count: number, hasUnread: boolean) => {
  globalUnreadCount = count;
  globalHasUnreadMessages = hasUnread;
  subscribers.forEach(callback => callback(count, hasUnread));
};

const checkUnreadMessages = async (userId: string) => {
  if (!userId) return;

  try {
    const { data, error } = await supabase
      .from("user_messages")
      .select("id")
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    const count = data?.length || 0;
    notifySubscribers(count, count > 0);
  } catch (error) {
    console.error("Error checking unread messages:", error);
  }
};

const setupSubscription = (userId: string) => {
  if (activeChannel || !userId) return;

  console.log("Setting up message notification subscription for user:", userId);
  
  activeChannel = supabase
    .channel(`message_notifications_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_messages',
        filter: `receiver_id=eq.${userId}`
      },
      () => {
        console.log("New message received, checking unread count");
        checkUnreadMessages(userId);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_messages',
        filter: `receiver_id=eq.${userId}`
      },
      () => {
        console.log("Message updated, checking unread count");
        checkUnreadMessages(userId);
      }
    )
    .subscribe();

  currentUserId = userId;
  checkUnreadMessages(userId);
};

const cleanupSubscription = () => {
  if (activeChannel) {
    console.log("Cleaning up message notification subscription");
    supabase.removeChannel(activeChannel);
    activeChannel = null;
    currentUserId = null;
  }
};

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(globalHasUnreadMessages);
  const subscriberRef = useRef<(count: number, hasUnread: boolean) => void>();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setHasUnreadMessages(false);
      notifySubscribers(0, false);
      return;
    }

    // Create subscriber callback
    const handleUpdate = (count: number, hasUnread: boolean) => {
      setUnreadCount(count);
      setHasUnreadMessages(hasUnread);
    };

    subscriberRef.current = handleUpdate;
    subscribers.push(handleUpdate);

    // Set up subscription if needed or user changed
    if (currentUserId !== user.id) {
      cleanupSubscription();
      setupSubscription(user.id);
    } else {
      // User is the same, just update local state with current global state
      setUnreadCount(globalUnreadCount);
      setHasUnreadMessages(globalHasUnreadMessages);
    }

    return () => {
      // Remove this component's subscriber
      if (subscriberRef.current) {
        subscribers = subscribers.filter(sub => sub !== subscriberRef.current);
      }
      
      // Only cleanup subscription if no more subscribers
      if (subscribers.length === 0) {
        cleanupSubscription();
        globalUnreadCount = 0;
        globalHasUnreadMessages = false;
      }
    };
  }, [user]);

  const refreshUnreadCount = () => {
    if (user) {
      checkUnreadMessages(user.id);
    }
  };

  return {
    unreadCount,
    hasUnreadMessages,
    refreshUnreadCount
  };
};
