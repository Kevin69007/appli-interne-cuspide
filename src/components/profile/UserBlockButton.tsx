
import { useState, useEffect } from "react";
import { Ban, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserBlockButtonProps {
  targetUserId: string;
  targetUsername: string;
}

const UserBlockButton = ({ targetUserId, targetUsername }: UserBlockButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if user is already blocked on component mount
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!user || !targetUserId) return;

      try {
        const { data, error } = await supabase
          .from("blocked_users")
          .select("id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", targetUserId)
          .maybeSingle();

        if (error) {
          console.error("Error checking block status:", error);
        } else {
          setIsBlocked(!!data);
        }
      } catch (error) {
        console.error("Unexpected error checking block status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkBlockStatus();
  }, [user, targetUserId]);

  const handleBlock = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id: targetUserId
        });

      if (error) throw error;

      setIsBlocked(true);
      toast({
        title: "User Blocked",
        description: `${targetUsername} has been blocked and can no longer message you.`,
      });
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", targetUserId);

      if (error) throw error;

      setIsBlocked(false);
      toast({
        title: "User Unblocked",
        description: `${targetUsername} has been unblocked.`,
      });
    } catch (error: any) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (isBlocked) {
    return (
      <Button
        onClick={handleUnblock}
        disabled={loading}
        variant="outline"
        size="sm"
        className="text-green-600 border-green-600 hover:bg-green-50"
      >
        <UserX className="w-4 h-4 mr-2" />
        {loading ? "Unblocking..." : "Unblock User"}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
          <Ban className="w-4 h-4 mr-2" />
          Block User
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {targetUsername}?</AlertDialogTitle>
          <AlertDialogDescription>
            This user will no longer be able to send you messages. You can unblock them later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} disabled={loading}>
            {loading ? "Blocking..." : "Block User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserBlockButton;
