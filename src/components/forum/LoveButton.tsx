
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LoveButtonProps {
  postId?: string;
  replyId?: string;
  initialLikes?: number;
  className?: string;
}

const LoveButton = ({ postId, replyId, initialLikes = 0, className = "" }: LoveButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserLike();
    }
    fetchLikeCount();
  }, [user, postId, replyId]);

  const checkUserLike = async () => {
    if (!user) return;

    try {
      const query = supabase
        .from("post_likes")
        .select("id")
        .eq("user_id", user.id);

      if (postId) {
        query.eq("post_id", postId);
      } else if (replyId) {
        query.eq("reply_id", replyId);
      }

      const { data } = await query.maybeSingle();
      setIsLiked(!!data);
    } catch (error) {
      console.error("Error checking user like:", error);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const query = supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true });

      if (postId) {
        query.eq("post_id", postId);
      } else if (replyId) {
        query.eq("reply_id", replyId);
      }

      const { count } = await query;
      setLikeCount(count || 0);
    } catch (error) {
      console.error("Error fetching like count:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLiked) {
        // Unlike
        const query = supabase
          .from("post_likes")
          .delete()
          .eq("user_id", user.id);

        if (postId) {
          query.eq("post_id", postId);
        } else if (replyId) {
          query.eq("reply_id", replyId);
        }

        const { error } = await query;
        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const likeData: any = {
          user_id: user.id,
          like_type: 'love'
        };

        if (postId) {
          likeData.post_id = postId;
        } else if (replyId) {
          likeData.reply_id = replyId;
        }

        const { error } = await supabase
          .from("post_likes")
          .insert(likeData);

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={`h-8 px-2 gap-1 ${className}`}
    >
      <Heart 
        className={`w-4 h-4 ${
          isLiked 
            ? "fill-red-500 text-red-500" 
            : "text-gray-500 hover:text-red-500"
        }`} 
      />
      <span className={`text-sm ${isLiked ? "text-red-500" : "text-gray-500"}`}>
        {likeCount}
      </span>
    </Button>
  );
};

export default LoveButton;
