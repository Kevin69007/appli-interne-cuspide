
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, X } from "lucide-react";

interface MessageReplyFormProps {
  originalMessageId: string;
  onReplySubmitted: () => void;
  onCancel: () => void;
}

const MessageReplyForm = ({ originalMessageId, onReplySubmitted, onCancel }: MessageReplyFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // Get the original message to determine routing
      const { data: originalMessage, error: fetchError } = await supabase
        .from("user_messages")
        .select("receiver_id, sender_id")
        .eq("id", originalMessageId)
        .single();

      if (fetchError) throw fetchError;

      // REPLY: Always route reply to the sender of the original message
      const replyToUserId = originalMessage.sender_id;

      // Check for block before sending
      const { data: blockedCheck } = await supabase
        .rpc('is_user_blocked', {
          sender_id: user.id,
          receiver_id: replyToUserId
        });

      if (blockedCheck) {
        toast({
          title: "Cannot send reply",
          description: "You have been blocked by this user",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Insert the reply as a profile message ON THE RECIPIENT'S PROFILE (their Messages tab)
      const { error } = await supabase
        .from("user_messages")
        .insert({
          sender_id: user.id,
          receiver_id: replyToUserId,
          message: `@Reply: ${replyText.trim()}`,
          is_profile_message: true,
          is_read: false
        });

      if (error) throw error;

      toast({
        title: "Reply sent!",
        description: "Your reply has been posted to the sender's profile (their Messages tab).",
      });

      setReplyText("");
      onReplySubmitted();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Reply to sender:</span>
        <Button onClick={onCancel} size="sm" variant="ghost" className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Write your reply..."
        rows={3}
        className="mb-3"
      />
      <div className="flex gap-2">
        <Button 
          onClick={handleSubmitReply} 
          disabled={!replyText.trim() || isSubmitting}
          size="sm"
        >
          <Send className="w-4 h-4 mr-1" />
          {isSubmitting ? "Sending..." : "Send Reply"}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default MessageReplyForm;
