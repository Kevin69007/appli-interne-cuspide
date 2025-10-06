
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, Reply, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MessageReplyForm from "./MessageReplyForm";
import { formatTimeAgo } from "@/utils/timeHelpers";
import { useAuth } from "@/contexts/AuthContext";

interface MessageCardProps {
  message: any;
  isOwnProfile: boolean;
  onDelete: (messageId: string) => Promise<boolean>;
  onMarkAsRead: (messageId: string) => Promise<boolean>;
  onReplySubmitted: () => void;
  isDeletingMessage?: (messageId: string) => boolean;
}

const MessageCard = ({ 
  message, 
  isOwnProfile, 
  onDelete, 
  onMarkAsRead, 
  onReplySubmitted,
  isDeletingMessage = () => false
}: MessageCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleProfileClick = (profile: any) => {
    if (profile?.username && profile.username !== "Unknown User") {
      navigate(`/profile/${encodeURIComponent(profile.username)}`);
    }
  };

  const handleReplyClick = (messageId: string) => {
    setReplyingTo(messageId);
  };

  const handleReplySubmitted = () => {
    setReplyingTo(null);
    onReplySubmitted();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDelete = async () => {
    if (isDeletingMessage(message.id)) return;
    await onDelete(message.id);
  };

  const isDeleting = isDeletingMessage(message.id);
  
  // Check if current user can delete this message
  // User can delete if it's on their own profile OR if they sent the message to someone else's profile
  const canDelete = isOwnProfile || (user && message.sender_id === user.id);

  return (
    <div className={`border rounded-lg p-4 ${message.is_read ? 'bg-white/50' : 'bg-blue-50/70'} ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <Avatar 
          className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => handleProfileClick(message.sender)}
        >
          <AvatarImage src={message.sender?.profile_image_url} />
          <AvatarFallback>
            {message.sender?.username ? 
              message.sender.username.charAt(0).toUpperCase() : 
              <User className="w-6 h-6" />
            }
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {message.sender?.username && message.sender.username !== "Unknown User" ? (
              <button
                className="font-medium text-pink-800 hover:text-pink-900 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer transition-colors"
                onClick={() => handleProfileClick(message.sender)}
                title={`View ${message.sender.username}'s profile`}
              >
                {message.sender.username}
              </button>
            ) : (
              <span className="font-medium text-gray-600">Anonymous</span>
            )}
            <span className="text-sm text-muted-foreground">
              {formatTimeAgo(message.created_at)}
            </span>
            {!message.is_read && isOwnProfile && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                New
              </span>
            )}
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
        </div>
      </div>
      
      {(isOwnProfile || canDelete) && (
        <div className="flex gap-2 mt-3">
          {!message.is_read && isOwnProfile && (
            <Button
              onClick={() => onMarkAsRead(message.id)}
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark as Read
            </Button>
          )}
          {isOwnProfile && (
            <Button
              onClick={() => handleReplyClick(message.id)}
              variant="outline"
              size="sm"
              className="text-pink-600 border-pink-200 hover:bg-pink-50"
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
          )}
          {canDelete && (
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      )}

      {replyingTo === message.id && (
        <MessageReplyForm 
          originalMessageId={message.id}
          onReplySubmitted={handleReplySubmitted}
          onCancel={handleCancelReply}
        />
      )}
    </div>
  );
};

export default MessageCard;
