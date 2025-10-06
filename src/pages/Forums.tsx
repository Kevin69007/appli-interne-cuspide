import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Plus, Users } from "lucide-react";
import { formatReplyTime } from "@/utils/timeHelpers";
import { Skeleton } from "@/components/ui/skeleton";
import { isPromotionActive } from "@/utils/discountUtils";

interface Forum {
  id: string;
  name: string;
  description: string;
  order_position: number;
  post_count?: number;
  reply_count?: number;
  last_activity_user?: string;
  last_activity_time?: string;
}

const ForumCardSkeleton = () => (
  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 h-[100px]">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="w-8 h-8 rounded flex-shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardHeader>
  </Card>
);

const Forums = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [forums, setForums] = useState<Forum[]>([]);
  const [forumsLoading, setForumsLoading] = useState(true);
  const showPromoBanner = isPromotionActive();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setForumsLoading(true);
      
      const { data, error } = await supabase
        .from("forums")
        .select(`
          id,
          name,
          description,
          order_position
        `)
        .order("order_position");

      if (error) {
        console.error("Error fetching forums:", error);
        return;
      }

      // Get post counts, reply counts and last activity info for each forum
      const forumsWithInfo = await Promise.all(
        (data || []).map(async (forum) => {
          // Get post count
          const { count: postCount } = await supabase
            .from("forum_posts")
            .select("*", { count: "exact", head: true })
            .eq("forum_id", forum.id);

          // Get reply count for all posts in this forum
          const { count: replyCount } = await supabase
            .from("forum_replies")
            .select(`
              *,
              forum_posts!inner (
                forum_id
              )
            `, { count: "exact", head: true })
            .eq("forum_posts.forum_id", forum.id);

          // Get the most recent reply from posts in this forum
          const { data: lastReply } = await supabase
            .from("forum_replies")
            .select(`
              created_at,
              profiles:user_id (
                username
              ),
              forum_posts!inner (
                forum_id
              )
            `)
            .eq("forum_posts.forum_id", forum.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get the most recent post in this forum
          const { data: lastPost } = await supabase
            .from("forum_posts")
            .select(`
              created_at,
              profiles:user_id (
                username
              )
            `)
            .eq("forum_id", forum.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Compare reply and post times to find the most recent activity
          let lastActivityUser = null;
          let lastActivityTime = null;

          const replyTime = lastReply ? new Date(lastReply.created_at).getTime() : 0;
          const postTime = lastPost ? new Date(lastPost.created_at).getTime() : 0;

          if (replyTime > postTime && lastReply) {
            lastActivityUser = lastReply.profiles?.username;
            lastActivityTime = lastReply.created_at;
          } else if (lastPost) {
            lastActivityUser = lastPost.profiles?.username;
            lastActivityTime = lastPost.created_at;
          }
          
          return { 
            ...forum, 
            post_count: postCount || 0,
            reply_count: replyCount || 0,
            last_activity_user: lastActivityUser,
            last_activity_time: lastActivityTime
          };
        })
      );
      
      setForums(forumsWithInfo);
    } finally {
      setForumsLoading(false);
    }
  };

  const navigateToForum = (forumId: string) => {
    navigate(`/forums/${forumId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
        {/* Fixed background pattern */}
        <div 
          className="fixed inset-0 opacity-5 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat',
            backgroundPosition: '0 0'
          }} 
        />
        
        <Navigation />
        <main className={showPromoBanner ? "loading-container-with-banner" : "loading-container"}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading forums...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      {/* Fixed background pattern */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }} 
      />
      
      <Navigation />
      
      <main className={showPromoBanner ? "page-with-nav-and-banner" : "page-with-nav"}>
        <div className="container mx-auto px-4 py-6 relative z-10 max-w-4xl">
          <div className="min-h-[800px]">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-pink-800 mb-4">Community Forums</h1>
              <p className="text-xl text-muted-foreground">Connect with other pet owners and share experiences</p>
            </div>

            {/* Forums container with minimum height to prevent jumping */}
            <div className="space-y-4 min-h-[600px]">
              {forumsLoading ? (
                // Show skeleton cards while loading
                Array.from({ length: 6 }).map((_, index) => (
                  <ForumCardSkeleton key={index} />
                ))
              ) : forums.length > 0 ? (
                forums.map((forum) => (
                  <Card 
                    key={forum.id} 
                    className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigateToForum(forum.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <MessageCircle className="w-8 h-8 text-pink-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-pink-800 text-lg leading-tight">{forum.name}</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground mt-1">
                              {forum.description}
                            </CardDescription>
                            <div className="mt-2 h-[20px]">
                              {forum.last_activity_user && forum.last_activity_time ? (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  Last updated by <span className="font-bold">{forum.last_activity_user}</span> at {formatReplyTime(forum.last_activity_time)}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No posts yet
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{forum.post_count} posts</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageCircle className="w-4 h-4" />
                            <span>{forum.reply_count} replies</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 h-[200px]">
                  <CardContent className="text-center py-8 flex flex-col items-center justify-center h-full">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No forums available yet</p>
                    <p className="text-sm text-muted-foreground">Check back later for community discussions!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Forums;
