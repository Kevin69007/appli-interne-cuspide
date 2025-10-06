import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, Plus, ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import UserProfileDisplay from "@/components/forum/detail/UserProfileDisplay";
import PostHeader from "@/components/forum/detail/PostHeader";
import PostContent from "@/components/forum/detail/PostContent";
import ReplyItem from "@/components/forum/detail/ReplyItem";
import DetailReplyForm from "@/components/forum/detail/DetailReplyForm";
import DetailNewPostForm from "@/components/forum/detail/DetailNewPostForm";
import ProfileLink from "@/components/forum/ProfileLink";
import { formatReplyTime } from "@/utils/timeHelpers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  reply_count: number;
  view_count?: number;
  is_edited?: boolean;
  edited_at?: string;
  last_reply_at?: string;
  last_reply_user?: any;
  user_profile: {
    username: string;
    xp: number;
    profile_image_url?: string;
    pawclub_member?: boolean;
  };
}

interface ForumReply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_edited?: boolean;
  edited_at?: string;
  user_profile: {
    username: string;
    xp: number;
    profile_image_url?: string;
  };
}

const POSTS_PER_PAGE = 10;
const REPLIES_PER_PAGE = 10;

const ForumDetail = () => {
  const { forumId, postId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forum, setForum] = useState<any>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newReplyContent, setNewReplyContent] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editReplyContent, setEditReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [postsPage, setPostsPage] = useState(1);
  const [repliesPage, setRepliesPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalReplies, setTotalReplies] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (forumId) {
      fetchForumData();
    }
  }, [forumId, postsPage]);

  useEffect(() => {
    if (selectedPost) {
      fetchReplies(selectedPost.id);
    }
  }, [selectedPost, repliesPage]);

  // Handle URL-based post selection
  useEffect(() => {
    if (postId && posts.length > 0 && !selectedPost) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        handlePostClick(post);
      }
    }
  }, [postId, posts, selectedPost]);

  const trackPostView = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('forum_post_views')
        .insert({
          post_id: postId,
          user_id: user?.id || null,
          ip_address: null
        });

      console.log('Post view tracked for:', postId);
    } catch (error) {
      console.log('View tracking error:', error);
    }

    // Get the updated view count from the database
    const { data: updatedPost } = await supabase
      .from("forum_posts")
      .select("view_count")
      .eq("id", postId)
      .single();

    return updatedPost?.view_count || 0;
  };

  const fetchForumData = async () => {
    setPostsLoading(true);
    
    // Get forum info
    const { data: forumData, error: forumError } = await supabase
      .from("forums")
      .select("*")
      .eq("id", forumId)
      .single();

    if (forumError) {
      console.error("Error fetching forum:", forumError);
      setPostsLoading(false);
      return;
    }

    setForum(forumData);

    // Get total posts count
    const { count: totalPostsCount } = await supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true })
      .eq("forum_id", forumId);

    setTotalPosts(totalPostsCount || 0);

    // Get paginated posts with their last reply info for sorting
    const startIndex = (postsPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE - 1;

    // First get all posts for this forum to determine sort order
    const { data: allPostsData, error: allPostsError } = await supabase
      .from("forum_posts")
      .select(`
        id,
        title,
        content,
        created_at,
        user_id,
        is_edited,
        edited_at,
        view_count
      `)
      .eq("forum_id", forumId);

    if (allPostsError) {
      console.error("Error fetching posts:", allPostsError);
      setPostsLoading(false);
      return;
    }

    // Get last reply info for each post to determine sort order
    const postsWithLastReply = await Promise.all(
      (allPostsData || []).map(async (post) => {
        const { data: lastReplyData } = await supabase
          .from("forum_replies")
          .select("created_at")
          .eq("post_id", post.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastActivityTime = lastReplyData?.[0]?.created_at || post.created_at;
        
        return {
          ...post,
          last_activity_time: lastActivityTime
        };
      })
    );

    // Sort by last activity (most recent first)
    postsWithLastReply.sort((a, b) => {
      return new Date(b.last_activity_time).getTime() - new Date(a.last_activity_time).getTime();
    });

    // Get the posts for the current page after sorting
    const paginatedPosts = postsWithLastReply.slice(startIndex, startIndex + POSTS_PER_PAGE);

    // Now get the detailed info for the paginated posts
    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const { count } = await supabase
          .from("forum_replies")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, xp, profile_image_url, pawclub_member")
          .eq("id", post.user_id)
          .single();

        // Get the most recent reply for last updated info
        const { data: lastReplyData } = await supabase
          .from("forum_replies")
          .select(`
            created_at,
            user_id,
            profiles!inner(username, xp, profile_image_url, pawclub_member)
          `)
          .eq("post_id", post.id)
          .order("created_at", { ascending: false })
          .limit(1);

        let lastUpdateInfo = null;
        if (lastReplyData && lastReplyData.length > 0) {
          const lastReply = lastReplyData[0];
          lastUpdateInfo = {
            timestamp: lastReply.created_at,
            user: lastReply.profiles
          };
        }

        return {
          ...post,
          user_profile: profileData || { username: "Anonymous", xp: 0 },
          reply_count: count || 0,
          last_reply_at: lastUpdateInfo?.timestamp,
          last_reply_user: lastUpdateInfo?.user
        };
      })
    );

    setPosts(postsWithDetails);
    setIsLoading(false);
    setPostsLoading(false);
  };

  const fetchReplies = async (postId: string) => {
    setRepliesLoading(true);

    // Get total replies count
    const { count: totalRepliesCount } = await supabase
      .from("forum_replies")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    setTotalReplies(totalRepliesCount || 0);

    // Get paginated replies
    const startIndex = (repliesPage - 1) * REPLIES_PER_PAGE;
    const endIndex = startIndex + REPLIES_PER_PAGE - 1;

    const { data: repliesData, error } = await supabase
      .from("forum_replies")
      .select(`
        id,
        content,
        created_at,
        user_id,
        is_edited,
        edited_at
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .range(startIndex, endIndex);

    if (error) {
      console.error("Error fetching replies:", error);
      setRepliesLoading(false);
      return;
    }

    const repliesWithProfiles = await Promise.all(
      (repliesData || []).map(async (reply) => {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, xp, profile_image_url, pawclub_member")
          .eq("id", reply.user_id)
          .single();

        return {
          ...reply,
          user_profile: profileData || { username: "Anonymous", xp: 0 }
        };
      })
    );

    setReplies(repliesWithProfiles);
    setRepliesLoading(false);
  };

  const handlePostClick = async (post: ForumPost) => {
    // Set selection and reset replies page
    setSelectedPost(post);
    setRepliesPage(1);

    // Track and get the latest count
    const newCount = await trackPostView(post.id);

    // Update selectedPost with the fresh count
    setSelectedPost((prev) =>
      prev ? { ...prev, view_count: newCount } : prev
    );

    // Update posts list so list badges stay in sync too
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, view_count: newCount } : p))
    );

    // Update URL
    navigate(`/forums/${forumId}/${post.id}`, { replace: true });
  };

  const handleBackToPosts = () => {
    setSelectedPost(null);
    setReplies([]); // Clear replies when going back
    // Update URL to remove post ID and go back to forum posts list
    navigate(`/forums/${forumId}`, { replace: true });
  };

  const handlePostsPageChange = (page: number) => {
    setPostsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRepliesPageChange = (page: number) => {
    setRepliesPage(page);
  };

  const createPost = async () => {
    if (!user || !newPostTitle.trim() || !newPostContent.trim()) return;

    const { error } = await supabase.from("forum_posts").insert([
      {
        forum_id: forumId,
        user_id: user.id,
        title: newPostTitle,
        content: newPostContent
      }
    ]);

    if (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Post created successfully",
      });
      setNewPostTitle("");
      setNewPostContent("");
      setShowNewPost(false);
      setPostsPage(1); // Go to first page to see new post
      fetchForumData();
    }
  };

  const createReply = async () => {
    if (!user || !selectedPost || !newReplyContent.trim()) return;

    const { error } = await supabase
      .from("forum_replies")
      .insert({
        post_id: selectedPost.id,
        user_id: user.id,
        content: newReplyContent
      });

    if (error) {
      console.error("Error creating reply:", error);
      toast({
        title: "Error",
        description: "Failed to create reply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Reply posted successfully",
      });
      setNewReplyContent("");
      
      // Calculate if we need to go to the last page for the new reply
      const newTotalReplies = totalReplies + 1;
      const lastPage = Math.ceil(newTotalReplies / REPLIES_PER_PAGE);
      setRepliesPage(lastPage);
      
      fetchReplies(selectedPost.id);
      fetchForumData();
    }
  };

  const updatePost = async (postId: string) => {
    if (!editPostTitle.trim() || !editPostContent.trim()) return;

    const { error } = await supabase
      .from("forum_posts")
      .update({
        title: editPostTitle,
        content: editPostContent,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq("id", postId);

    if (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Post updated successfully",
      });
      
      // Update selectedPost immediately with new data
      if (selectedPost?.id === postId) {
        setSelectedPost({
          ...selectedPost,
          title: editPostTitle,
          content: editPostContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        });
      }
      
      // Update posts list immediately
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, title: editPostTitle, content: editPostContent, is_edited: true, edited_at: new Date().toISOString() }
            : post
        )
      );
      
      setEditingPost(null);
      fetchForumData();
    }
  };

  const updateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) return;

    const { error } = await supabase
      .from("forum_replies")
      .update({
        content: editReplyContent,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq("id", replyId);

    if (error) {
      console.error("Error updating reply:", error);
      toast({
        title: "Error",
        description: "Failed to update reply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Reply updated successfully",
      });
      
      // Update replies immediately
      setReplies(prevReplies =>
        prevReplies.map(reply =>
          reply.id === replyId
            ? { ...reply, content: editReplyContent, is_edited: true, edited_at: new Date().toISOString() }
            : reply
        )
      );
      
      setEditingReply(null);
      if (selectedPost) {
        fetchReplies(selectedPost.id);
      }
    }
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from("forum_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Post deleted successfully",
      });
      if (selectedPost?.id === postId) {
        handleBackToPosts(); // Use the back function when deleting current post
      }
      fetchForumData();
    }
  };

  const deleteReply = async (replyId: string) => {
    const { error } = await supabase
      .from("forum_replies")
      .delete()
      .eq("id", replyId);

    if (error) {
      console.error("Error deleting reply:", error);
      toast({
        title: "Error",
        description: "Failed to delete reply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Reply deleted successfully",
      });
      if (selectedPost) {
        fetchReplies(selectedPost.id);
      }
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
        <div 
          className="fixed inset-0 opacity-5 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            backgroundRepeat: 'repeat',
            backgroundPosition: '0 0'
          }} 
        />
        
        <Navigation />
        <main className="pt-24 px-6 max-w-4xl mx-auto relative z-10">
          <div className="min-h-[800px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-lg">Loading forum...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const totalPostsPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const totalRepliesPages = Math.ceil(totalReplies / REPLIES_PER_PAGE);

  const PostsPagination = () => {
    const renderPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalPostsPages <= maxVisiblePages) {
        // Show all pages if total pages is 5 or less
        for (let i = 1; i <= totalPostsPages; i++) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePostsPageChange(i)}
                isActive={i === postsPage}
                className="cursor-pointer"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      } else {
        // Always show first page
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink
              onClick={() => handlePostsPageChange(1)}
              isActive={1 === postsPage}
              className="cursor-pointer"
            >
              1
            </PaginationLink>
          </PaginationItem>
        );

        // Add ellipsis after first page if needed
        if (postsPage > 3) {
          pages.push(
            <PaginationItem key="ellipsis-start">
              <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">...</span>
            </PaginationItem>
          );
        }

        // Show pages around current page
        const start = Math.max(2, postsPage - 1);
        const end = Math.min(totalPostsPages - 1, postsPage + 1);

        for (let i = start; i <= end; i++) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handlePostsPageChange(i)}
                isActive={i === postsPage}
                className="cursor-pointer"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }

        // Add ellipsis before last page if needed
        if (postsPage < totalPostsPages - 2) {
          pages.push(
            <PaginationItem key="ellipsis-end">
              <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">...</span>
            </PaginationItem>
          );
        }

        // Always show last page
        if (totalPostsPages > 1) {
          pages.push(
            <PaginationItem key={totalPostsPages}>
              <PaginationLink
                onClick={() => handlePostsPageChange(totalPostsPages)}
                isActive={totalPostsPages === postsPage}
                className="cursor-pointer"
              >
                {totalPostsPages}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      return pages;
    };

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePostsPageChange(Math.max(1, postsPage - 1))}
              className={postsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePostsPageChange(Math.min(totalPostsPages, postsPage + 1))}
              className={postsPage === totalPostsPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const RepliesPagination = () => {
    const renderPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalRepliesPages <= maxVisiblePages) {
        // Show all pages if total pages is 5 or less
        for (let i = 1; i <= totalRepliesPages; i++) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handleRepliesPageChange(i)}
                isActive={i === repliesPage}
                className="cursor-pointer"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      } else {
        // Always show first page
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink
              onClick={() => handleRepliesPageChange(1)}
              isActive={1 === repliesPage}
              className="cursor-pointer"
            >
              1
            </PaginationLink>
          </PaginationItem>
        );

        // Add ellipsis after first page if needed
        if (repliesPage > 3) {
          pages.push(
            <PaginationItem key="ellipsis-start">
              <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">...</span>
            </PaginationItem>
          );
        }

        // Show pages around current page
        const start = Math.max(2, repliesPage - 1);
        const end = Math.min(totalRepliesPages - 1, repliesPage + 1);

        for (let i = start; i <= end; i++) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => handleRepliesPageChange(i)}
                isActive={i === repliesPage}
                className="cursor-pointer"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }

        // Add ellipsis before last page if needed
        if (repliesPage < totalRepliesPages - 2) {
          pages.push(
            <PaginationItem key="ellipsis-end">
              <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">...</span>
            </PaginationItem>
          );
        }

        // Always show last page
        if (totalRepliesPages > 1) {
          pages.push(
            <PaginationItem key={totalRepliesPages}>
              <PaginationLink
                onClick={() => handleRepliesPageChange(totalRepliesPages)}
                isActive={totalRepliesPages === repliesPage}
                className="cursor-pointer"
              >
                {totalRepliesPages}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      return pages;
    };

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handleRepliesPageChange(Math.max(1, repliesPage - 1))}
              className={repliesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationNext 
              onClick={() => handleRepliesPageChange(Math.min(totalRepliesPages, repliesPage + 1))}
              className={repliesPage === totalRepliesPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }} 
      />
      
      <Navigation />
      <main className="pt-24 px-6 max-w-4xl mx-auto relative z-10 pb-20">
        <div className="min-h-[800px]">
          <div className="mb-8">
            <Button
              onClick={() => navigate("/forums")}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Forums
            </Button>
            
            <h1 className="text-4xl font-bold text-pink-800 mb-2">{forum?.name}</h1>
            <p className="text-xl text-muted-foreground">{forum?.description}</p>
          </div>

          <div className="space-y-6">
            {selectedPost ? (
              <div className="space-y-6">
                <Button
                  onClick={handleBackToPosts}
                  variant="outline"
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Posts
                </Button>

                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
                  <CardHeader>
                    <PostHeader
                      post={selectedPost}
                      user={user}
                      isEditing={editingPost === selectedPost.id}
                      onEdit={() => {
                        setEditingPost(selectedPost.id);
                        setEditPostTitle(selectedPost.title);
                        setEditPostContent(selectedPost.content);
                      }}
                      onDelete={() => deletePost(selectedPost.id)}
                    />
                    {/* Add view count display */}
                    <div className="flex items-center gap-4 pt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        {selectedPost.view_count || 0} {(selectedPost.view_count || 0) === 1 ? 'view' : 'views'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {selectedPost.reply_count} {selectedPost.reply_count === 1 ? 'reply' : 'replies'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PostContent
                      post={selectedPost}
                      isEditing={editingPost === selectedPost.id}
                      editTitle={editPostTitle}
                      editContent={editPostContent}
                      onTitleChange={setEditPostTitle}
                      onContentChange={setEditPostContent}
                      onSave={() => updatePost(selectedPost.id)}
                      onCancel={() => setEditingPost(null)}
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-pink-800">Replies</h3>
                    {totalReplies > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Page {repliesPage} of {totalRepliesPages} ({totalReplies} replies)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    {repliesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        {replies.length > 0 && (
                          <div className="space-y-4 mb-6">
                            {replies.map((reply) => (
                              <ReplyItem
                                key={reply.id}
                                reply={reply}
                                user={user}
                                isEditing={editingReply === reply.id}
                                editContent={editReplyContent}
                                onEdit={() => {
                                  setEditingReply(reply.id);
                                  setEditReplyContent(reply.content);
                                }}
                                onDelete={() => deleteReply(reply.id)}
                                onContentChange={setEditReplyContent}
                                onSave={() => updateReply(reply.id)}
                                onCancel={() => setEditingReply(null)}
                              />
                            ))}
                          </div>
                        )}

                        {totalRepliesPages > 1 && (
                          <div className="mb-6">
                            <RepliesPagination />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <DetailReplyForm
                    content={newReplyContent}
                    onContentChange={setNewReplyContent}
                    onSubmit={createReply}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-pink-800">Posts</h2>
                  <div className="flex items-center gap-4">
                    {totalPosts > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Page {postsPage} of {totalPostsPages} ({totalPosts} posts)
                      </p>
                    )}
                    <Button
                      onClick={() => setShowNewPost(!showNewPost)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Post
                    </Button>
                  </div>
                </div>

                {showNewPost && (
                  <DetailNewPostForm
                    title={newPostTitle}
                    content={newPostContent}
                    onTitleChange={setNewPostTitle}
                    onContentChange={setNewPostContent}
                    onSubmit={createPost}
                    onCancel={() => setShowNewPost(false)}
                  />
                )}

                {/* Top pagination */}
                {totalPostsPages > 1 && <PostsPagination />}

                {/* Fixed height container for posts to prevent jumping */}
                <div className="min-h-[600px]">
                  {postsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {posts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow cursor-pointer"
                            onClick={() => handlePostClick(post)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <UserProfileDisplay 
                                    profile={post.user_profile} 
                                    userId={post.user_id}
                                    timestamp={post.created_at}
                                  />
                                  <h3 className="text-pink-800 text-xl font-semibold line-clamp-1 mt-2 mb-2">{post.title}</h3>
                                  {post.last_reply_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Last reply by {post.last_reply_user?.username} {formatReplyTime(post.last_reply_at)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                                  <Badge variant="secondary" className="text-xs">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {post.view_count || 0} views
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {post.reply_count} replies
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>

                      {/* Bottom pagination */}
                      {totalPostsPages > 1 && (
                        <div className="mt-8">
                          <PostsPagination />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForumDetail;
