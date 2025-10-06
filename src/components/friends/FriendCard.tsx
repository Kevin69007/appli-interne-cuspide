import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GiftPawDollarsButton from "./GiftPawDollarsButton";
import GiftLitterLicenseButton from "./GiftLitterLicenseButton";
import SimpleAvatar from "@/components/ui/simple-avatar";

interface Profile {
  id: string;
  username: string;
  profile_image_url?: string;
  profile_description_short?: string;
}

interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend?: Profile;
}

interface FriendCardProps {
  friendship: Friendship;
  onRemoveFriend: (friendshipId: string) => void;
}

const FriendCard = ({ friendship, onRemoveFriend }: FriendCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-pink-50/30 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-4 pt-6">
        <div className="flex items-start gap-4">
          <div 
            className="cursor-pointer transform transition-transform duration-200 hover:scale-105"
            onClick={() => navigate(`/profile/${friendship.friend?.username}`)}
          >
            <SimpleAvatar
              src={friendship.friend?.profile_image_url}
              alt={friendship.friend?.username || "Friend"}
              fallback={friendship.friend?.username?.charAt(0).toUpperCase()}
              size="lg"
              className="ring-3 ring-white shadow-lg group-hover:ring-pink-200 transition-all duration-300 h-12 w-12"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <CardTitle 
              className="text-xl font-bold cursor-pointer text-gray-800 hover:text-pink-700 transition-colors duration-200 truncate group-hover:text-pink-600"
              onClick={() => navigate(`/profile/${friendship.friend?.username}`)}
            >
              {friendship.friend?.username}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {friendship.friend?.profile_description_short || "No description available"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative pt-0 pb-6">
        <div className="flex gap-2">
          {friendship.friend && (
            <>
              <GiftPawDollarsButton 
                recipientId={friendship.friend.id}
                recipientUsername={friendship.friend.username}
              />
              <GiftLitterLicenseButton 
                friendId={friendship.friend.id}
                friendUsername={friendship.friend.username}
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveFriend(friendship.id)}
            className="flex-1 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <UserX className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendCard;
