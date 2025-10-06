
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

const MessageNotificationIcon = () => {
  const { hasUnreadMessages } = useMessageNotifications();
  const navigate = useNavigate();

  if (!hasUnreadMessages) return null;

  const handleClick = () => {
    navigate("/profile?tab=messages");
  };

  return (
    <div 
      className="relative cursor-pointer hover:opacity-80 transition-opacity"
      onClick={handleClick}
    >
      <MessageCircle className="w-5 h-5 text-pink-600" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
    </div>
  );
};

export default MessageNotificationIcon;
