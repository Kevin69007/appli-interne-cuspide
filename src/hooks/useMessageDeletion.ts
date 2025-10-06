
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMessageDeletion = (
  user: any,
  isOwnProfile: boolean,
  actualProfileUserId: string,
  onDeleteSuccess: (messageId: string) => void
) => {
  const { toast } = useToast();
  const [deletingMessages, setDeletingMessages] = useState<Set<string>>(new Set());

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!user || deletingMessages.has(messageId)) {
      return false;
    }

    setDeletingMessages(prev => new Set([...prev, messageId]));

    try {
      console.log("🗑️ Starting deletion for message:", messageId);
      
      // Get message details first to determine deletion permissions
      const { data: messageData, error: fetchError } = await supabase
        .from("user_messages")
        .select("sender_id, receiver_id")
        .eq("id", messageId)
        .single();

      if (fetchError) {
        console.error("❌ Failed to fetch message:", fetchError);
        toast({
          title: "Error",
          description: `Failed to fetch message: ${fetchError.message}`,
          variant: "destructive",
        });
        return false;
      }

      // Check deletion permissions
      const canDelete = 
        (isOwnProfile && user.id === actualProfileUserId) || // User can delete messages on their own profile
        (user.id === messageData.sender_id); // User can delete their own sent messages

      if (!canDelete) {
        toast({
          title: "Error",
          description: "You don't have permission to delete this message",
          variant: "destructive",
        });
        return false;
      }

      // Perform deletion with appropriate conditions
      let deleteQuery = supabase.from("user_messages").delete({ count: "exact" }).eq("id", messageId);

      if (isOwnProfile) {
        // On own profile, ensure user is the receiver
        deleteQuery = deleteQuery.eq("receiver_id", user.id);
      } else {
        // On other's profile, ensure user is the sender
        deleteQuery = deleteQuery.eq("sender_id", user.id);
      }

      const { error: deleteError, count } = await deleteQuery;

      if (deleteError) {
        console.error("❌ Deletion failed:", deleteError);
        toast({
          title: "Error",
          description: `Failed to delete message: ${deleteError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (count === 0) {
        console.log("⚠️ No rows were deleted - message may not exist or permission denied");
        toast({
          title: "Error",
          description: "Could not delete message - it may have been already deleted or you lack permission",
          variant: "destructive",
        });
        return false;
      }

      console.log("✅ Message permanently deleted, rows affected:", count);
      toast({
        title: "Success",
        description: "Message permanently deleted",
      });

      // Update UI state immediately
      onDeleteSuccess(messageId);
      return true;

    } catch (error: any) {
      console.error("❌ Unexpected deletion error:", error);
      toast({
        title: "Error",
        description: `Failed to delete message: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setDeletingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  return {
    deleteMessage,
    isDeletingMessage: (messageId: string) => deletingMessages.has(messageId)
  };
};
