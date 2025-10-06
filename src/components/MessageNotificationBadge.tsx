
import { useNavigate } from "react-router-dom";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

const MessageNotificationBadge = () => {
  const { unreadCount } = useMessageNotifications();
  const navigate = useNavigate();

  if (unreadCount === 0) return null;

  const handleClick = () => {
    navigate("/profile?tab=messages");
  };

  return (
    <div 
      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 cursor-pointer hover:bg-red-600 transition-colors"
      onClick={handleClick}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default MessageNotificationBadge;
