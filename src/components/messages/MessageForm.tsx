
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageFormProps {
  onSendMessage: (message: string) => Promise<boolean>;
}

const MessageForm = ({ onSendMessage }: MessageFormProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const success = await onSendMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
    setIsSending(false);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800">Send a Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Write your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={3}
          disabled={isSending}
        />
        <Button 
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          className="bg-pink-600 hover:bg-pink-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSending ? "Sending..." : "Send Message"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessageForm;
