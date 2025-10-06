
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import FormattedText from "./FormattedText";
import ProfileLink from "./ProfileLink";
import LoveButton from "./LoveButton";

interface ReplyCardProps {
  reply: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
      username: string;
      profile_image_url?: string;
      xp?: number;
      pawclub_member?: boolean;
    };
    is_edited?: boolean;
    edited_at?: string;
  };
}

const ReplyCard = ({ reply }: ReplyCardProps) => {
  const displayTime = reply.is_edited && reply.edited_at ? reply.edited_at : reply.created_at;
  const timeLabel = reply.is_edited ? 'edited' : 'posted';

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-md border-pink-100 ml-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ProfileLink 
              profile={{
                username: reply.profiles?.username || "Unknown User",
                profile_image_url: reply.profiles?.profile_image_url,
                xp: reply.profiles?.xp,
                pawclub_member: reply.profiles?.pawclub_member
              }}
            />
            <span className="text-sm text-muted-foreground">
              {timeLabel} {formatDistanceToNow(new Date(displayTime))} ago
              {reply.is_edited && (
                <span className="text-xs text-muted-foreground ml-1">(edited)</span>
              )}
            </span>
          </div>
          <LoveButton replyId={reply.id} />
        </div>
      </CardHeader>
      <CardContent>
        <FormattedText content={reply.content} className="text-gray-700" />
      </CardContent>
    </Card>
  );
};

export default ReplyCard;
