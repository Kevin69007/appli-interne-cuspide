import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFriendRequestNotifications } from "@/hooks/useFriendRequestNotifications";

const FriendRequestNotificationIcon = () => {
  const { hasPendingRequests } = useFriendRequestNotifications();
  const navigate = useNavigate();

  if (!hasPendingRequests) return null;

  const handleClick = () => {
    navigate("/profile?tab=friends");
  };

  return (
    <div 
      className="relative cursor-pointer hover:opacity-80 transition-opacity"
      onClick={handleClick}
    >
      <Users className="w-5 h-5 text-blue-600" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
    </div>
  );
};

export default FriendRequestNotificationIcon;