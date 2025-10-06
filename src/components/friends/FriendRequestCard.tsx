
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  username: string;
  profile_image_url?: string;
  profile_description_short?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

const FriendRequestCard = ({ request, type, onAccept, onDecline, onCancel }: FriendRequestCardProps) => {
  const navigate = useNavigate();
  const profile = type === 'received' ? request.sender : request.receiver;

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/profile/${profile?.username}`)}
          >
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-pink-600 font-medium">
                {profile?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <CardTitle 
              className="text-lg cursor-pointer hover:text-pink-700 transition-colors"
              onClick={() => navigate(`/profile/${profile?.username}`)}
            >
              {profile?.username}
            </CardTitle>
            <CardDescription>
              {profile?.profile_description_short || "No description"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {type === 'received' ? (
          <div className="flex gap-2">
            <Button
              onClick={() => onAccept?.(request.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => onDecline?.(request.id)}
              className="flex-1"
            >
              <UserX className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Badge variant="outline">Pending</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel?.(request.id)}
            >
              <UserX className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendRequestCard;
