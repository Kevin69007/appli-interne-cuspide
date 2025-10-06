
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import NewPostForm from "./forum/NewPostForm";
import PostCard from "./forum/PostCard";
import ReplyForm from "./forum/ReplyForm";
import ReplyCard from "./forum/ReplyCard";
import ProfileLink from "./forum/ProfileLink";
import { formatReplyTime } from "@/utils/timeHelpers";
import { Skeleton } from "@/components/ui/skeleton";

interface Forum {
  id: string;
  name: string;
  description: string;
  created_at: string;
  order_position: number;
}

interface RecentPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  forum_id: string;
  reply_count: number;
  view_count: number;
  forum: {
    name: string;
  };
  user_profile: {
    username: string;
    profile_image_url?: string;
    xp?: number;
    pawclub_member?: boolean;
  };
  last_reply_at?: string;
  last_reply_user?: {
    username: string;
    profile_image_url?: string;
    xp?: number;
    pawclub_member?: boolean;
  };
}

const ForumSkeleton = () => (
  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 h-[128px]">
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="pt-0">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

const PostSkeleton = () => (
  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 h-[160px]">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="text-right space-y-2 flex-shrink-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

const ForumPosts = () => {
  const { user, loading } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [forumsLoading, setForumsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [replies, setReplies] = useState<{ [postId: string]: any[] }>({});

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth";
      return;
    }

    if (user) {
      fetchForums();
      fetchRecentPosts();
    }
  }, [user, loading]);

  const fetchForums = async () => {
    try {
      setForumsLoading(true);
      const { data, error } = await supabase.from("forums").select("*");

      if (error) {
        console.error("Error fetching forums:", error);
        return;
      }

      setForums(data || []);
    } finally {
      setForumsLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      setPostsLoading(true);
      
      // Get posts with their basic info, forum data, and view_count from forum_posts
      const { data: postsData, error } = await supabase
        .from("forum_posts")
        .select(`
          id,
          title,
          content,
          created_at,
          user_id,
          forum_id,
          view_count,
          forums (
            name
          ),
          profiles (
            username,
            profile_image_url,
            xp,
            pawclub_member
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching recent posts:", error);
        return;
      }

      // Process posts to get reply counts and last reply info
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get actual reply count
          const { count: replyCount } = await supabase
            .from("forum_replies")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Get the most recent reply info
          const { data: lastReplyData } = await supabase
            .from("forum_replies")
            .select(`
              created_at,
              profiles!inner(username, profile_image_url, pawclub_member)
            `)
            .eq("post_id", post.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...post,
            reply_count: replyCount || 0,
            view_count: post.view_count || 0, // Use view_count from forum_posts
            forum: { name: post.forums?.name },
            user_profile: { 
              username: post.profiles?.username, 
              profile_image_url: post.profiles?.profile_image_url,
              xp: post.profiles?.xp,
              pawclub_member: post.profiles?.pawclub_member 
            },
            last_reply_at: lastReplyData?.[0]?.created_at,
            last_reply_user: lastReplyData?.[0]?.profiles
          };
        })
      );

      // Sort posts by last activity (last reply time or creation time if no replies)
      postsWithCounts.sort((a, b) => {
        const aTime = a.last_reply_at || a.created_at;
        const bTime = b.last_reply_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      // Take only the top 5 after sorting
      setRecentPosts(postsWithCounts.slice(0, 5));
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !selectedForumId || !newPostTitle || !newPostContent) return;

    const { error } = await supabase.from("forum_posts").insert([
      {
        forum_id: selectedForumId,
        user_id: user.id,
        title: newPostTitle,
        content: newPostContent
      }
    ]);

    if (error) {
      console.error("Error creating post:", error);
    } else {
      setNewPostTitle("");
      setNewPostContent("");
      setShowNewPostForm(false);
      fetchRecentPosts();
    }
  };

  const fetchReplies = async (postId: string) => {
    const { data, error } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching replies:", error);
      return;
    }

    setReplies((prevReplies) => ({
      ...prevReplies,
      [postId]: data || []
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading forums...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forums Grid with consistent height */}
      <div className="min-h-[200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forumsLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <ForumSkeleton key={index} />
            ))
          ) : (
            forums.map((forum) => (
              <Link to={`/forums/${forum.id}`} key={forum.id}>
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow h-[128px]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-pink-800 text-lg leading-tight">{forum.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm line-clamp-2">{forum.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent Posts Section with consistent height */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-pink-800">Recent Posts</h2>
        </div>
        
        <div className="min-h-[800px]">
          <div className="space-y-4">
            {postsLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <PostSkeleton key={index} />
              ))
            ) : recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <Link to={`/forums/${post.forum_id}/${post.id}`} key={post.id}>
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-pink-800 text-xl font-semibold line-clamp-1 mb-2">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            in {post.forum?.name} by{' '}
                            <span onClick={(e) => e.stopPropagation()}>
                              <ProfileLink 
                                profile={{
                                  username: post.user_profile?.username,
                                  profile_image_url: post.user_profile?.profile_image_url,
                                  xp: post.user_profile?.xp,
                                  pawclub_member: post.user_profile?.pawclub_member
                                }}
                                showIcon={false}
                                className="inline"
                              />
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {post.last_reply_at ? (
                              <>Last reply {formatReplyTime(post.last_reply_at)}</>
                            ) : (
                              <>Posted {formatReplyTime(post.created_at)}</>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span className="font-medium">{post.view_count}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageCircle className="w-4 h-4" />
                            <span className="font-medium">{post.reply_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 h-[200px]">
                <CardContent className="text-center py-8 flex flex-col items-center justify-center h-full">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No recent posts yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to start a discussion!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPosts;
