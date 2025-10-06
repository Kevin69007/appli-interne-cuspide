
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMessageActions = (user: any, isOwnProfile: boolean) => {
  const { toast } = useToast();

  const markAsRead = async (messageId: string): Promise<boolean> => {
    if (!user || !isOwnProfile) return false;

    try {
      const { error } = await supabase
        .from("user_messages")
        .update({ is_read: true })
        .eq("id", messageId)
        .eq("receiver_id", user.id);

      if (error) {
        console.error("Error marking message as read:", error);
        toast({
          title: "Error",
          description: "Failed to mark message as read",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Message marked as read",
      });
      return true;
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      toast({
        title: "Error",
        description: `Failed to mark message as read: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const sendMessage = async (messageText: string, receiverId: string): Promise<boolean> => {
    if (!user || !messageText.trim() || user.id === receiverId) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from("user_messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: messageText.trim(),
          is_profile_message: true,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });

      return true;
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    markAsRead,
    sendMessage
  };
};
