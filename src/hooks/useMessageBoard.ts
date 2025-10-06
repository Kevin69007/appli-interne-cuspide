
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessageDeletion } from "./useMessageDeletion";
import { useMessageActions } from "./useMessageActions";

const MESSAGES_PER_PAGE = 10;

export const useMessageBoard = (profileUserId?: string, isOwnProfile = true) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);

  const actualProfileUserId = profileUserId || user?.id;

  const handleMessageDeleted = (messageId: string) => {
    console.log("🗑️ Permanently removing message from UI:", messageId);
    setMessages(prev => {
      const filtered = prev.filter(msg => msg.id !== messageId);
      console.log("📊 Messages before deletion:", prev.length, "after:", filtered.length);
      return filtered;
    });
    setTotalMessages(prev => Math.max(0, prev - 1));
  };

  const handleMessageMarkedAsRead = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      )
    );
  };

  const { deleteMessage, isDeletingMessage } = useMessageDeletion(
    user,
    isOwnProfile,
    actualProfileUserId,
    handleMessageDeleted
  );

  const { markAsRead: markMessageAsRead, sendMessage: sendNewMessage } = useMessageActions(
    user,
    isOwnProfile
  );

  useEffect(() => {
    if (actualProfileUserId) {
      fetchMessages();
    }
  }, [actualProfileUserId, currentPage]);

  const fetchMessages = async () => {
    if (!actualProfileUserId) return;

    try {
      setLoading(true);
      console.log("📧 Fetching messages for profile:", actualProfileUserId, "page:", currentPage);

      // Get total count first - with consistent query structure
      const { count, error: countError } = await supabase
        .from("user_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", actualProfileUserId)
        .eq("is_profile_message", true);

      if (countError) {
        console.error("Error getting message count:", countError);
        throw countError;
      }
      
      console.log("📊 Total messages found:", count);
      
      // Always set total first to prevent layout shifts
      const messageCount = count || 0;
      setTotalMessages(messageCount);

      const startIndex = (currentPage - 1) * MESSAGES_PER_PAGE;
      const endIndex = startIndex + MESSAGES_PER_PAGE - 1;

      // Fetch messages with consistent structure
      const { data: messagesData, error } = await supabase
        .from("user_messages")
        .select("*")
        .eq("receiver_id", actualProfileUserId)
        .eq("is_profile_message", true)
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }

      console.log("📧 Messages data received:", messagesData?.length || 0);

      if (!messagesData) {
        setMessages([]);
        return;
      }

      // Fetch sender profiles in batch
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];
      let senderProfiles: any[] = [];

      if (senderIds.length > 0) {
        const { data: profilesData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, profile_image_url")
          .in("id", senderIds);

        if (profileError) {
          console.error("Error fetching sender profiles:", profileError);
          throw profileError;
        }
        senderProfiles = profilesData || [];
      }

      // Combine messages with sender data
      const messagesWithSenders = messagesData.map(message => ({
        ...message,
        sender: senderProfiles.find(profile => profile.id === message.sender_id) || {
          id: message.sender_id,
          username: "Unknown User",
          profile_image_url: null
        }
      }));

      console.log("📧 Final messages with senders:", messagesWithSenders.length);
      setMessages(messagesWithSenders);
      
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      setMessages([]);
      setTotalMessages(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    const success = await markMessageAsRead(messageId);
    if (success) {
      handleMessageMarkedAsRead(messageId);
    }
    return success;
  };

  const sendMessage = async (messageText: string) => {
    if (!actualProfileUserId) return false;
    
    const success = await sendNewMessage(messageText, actualProfileUserId);
    if (success) {
      setCurrentPage(1);
      await fetchMessages();
    }
    return success;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(totalMessages / MESSAGES_PER_PAGE);

  return {
    messages,
    loading,
    currentPage,
    totalMessages,
    totalPages,
    user,
    actualProfileUserId,
    isOwnProfile,
    fetchMessages,
    deleteMessage,
    markAsRead,
    sendMessage,
    handlePageChange,
    isDeletingMessage,
    MESSAGES_PER_PAGE
  };
};
