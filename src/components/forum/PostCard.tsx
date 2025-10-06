
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileLink from "./ProfileLink";
import LoveButton from "./LoveButton";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
      username: string;
      profile_image_url?: string;
      xp?: number;
      pawclub_member?: boolean;
    };
    forum_replies?: { count: number }[];
    is_edited?: boolean;
    edited_at?: string;
    last_reply_at?: string;
    last_reply_user?: {
      username: string;
      profile_image_url?: string;
      xp?: number;
      pawclub_member?: boolean;
    };
    view_count?: number;
  };
  onClick: () => void;
}

const PostCard = ({ post, onClick }: PostCardProps) => {
  const replyCount = post.forum_replies?.[0]?.count || 0;
  const viewCount = post.view_count || 0; // Use view_count from the post object
  
  // Determine what time to show - last reply time or post creation time
  const lastActivityTime = post.last_reply_at || post.created_at;
  const lastActivityUser = post.last_reply_user || post.profiles;
  const isReplyActivity = !!post.last_reply_at;

  const handleClick = async () => {
    // Track view when post is clicked
    if (post.id) {
      try {
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        
        // Always insert a new view record - let the database handle uniqueness if needed
        // This ensures views are properly tracked via the trigger
        await supabase
          .from('forum_post_views')
          .insert({
            post_id: post.id,
            user_id: user?.id || null,
            ip_address: null
          });
        
        console.log('Post view tracked for post:', post.id);
      } catch (error) {
        // Log but don't block user interaction
        console.log('View tracking error:', error);
      }
    }
    
    onClick();
  };

  return (
    <Card 
      className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ProfileLink 
                profile={{
                  username: post.profiles?.username || "Unknown User",
                  profile_image_url: post.profiles?.profile_image_url,
                  xp: post.profiles?.xp,
                  pawclub_member: post.profiles?.pawclub_member
                }}
              />
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at))} ago
              </span>
            </div>
            <h3 className="text-lg font-semibold text-pink-800 hover:text-pink-900 mb-2">
              {post.title}
            </h3>
            {lastActivityUser?.username && (
              <div className="text-xs text-muted-foreground">
                Last {isReplyActivity ? 'reply' : 'updated'} by{' '}
                <span className="font-bold">{lastActivityUser.username}</span>{' '}
                {formatDistanceToNow(new Date(lastActivityTime))} ago
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{viewCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{replyCount}</span>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <LoveButton postId={post.id} />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PostCard;
