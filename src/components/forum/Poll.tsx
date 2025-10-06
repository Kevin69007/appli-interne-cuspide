
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PollProps {
  question: string;
  options: string[];
  pollId: string;
  postId?: string; // Add postId to create polls if they don't exist
}

interface PollOption {
  id: string;
  option_text: string;
  vote_count: number;
}

interface UserVote {
  option_id: string;
}

const Poll = ({ question, options, pollId, postId }: PollProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [actualPollId, setActualPollId] = useState<string | null>(null);

  // Create or get poll data from database
  const initializePoll = async () => {
    try {
      // First, try to find existing poll by content-based ID or question
      const { data: existingPoll } = await supabase
        .from("forum_polls")
        .select("id")
        .eq("question", question)
        .limit(1)
        .single();

      let finalPollId = existingPoll?.id;

      // If no existing poll found, create a new one (if we have a postId)
      if (!finalPollId && postId) {
        const { data: newPoll, error: pollError } = await supabase
          .from("forum_polls")
          .insert({
            post_id: postId,
            question: question
          })
          .select("id")
          .single();

        if (pollError) {
          console.error("Error creating poll:", pollError);
          return;
        }

        finalPollId = newPoll.id;

        // Create poll options
        const optionsData = options.map(option => ({
          poll_id: finalPollId,
          option_text: option
        }));

        const { error: optionsError } = await supabase
          .from("forum_poll_options")
          .insert(optionsData);

        if (optionsError) {
          console.error("Error creating poll options:", optionsError);
          return;
        }
      }

      setActualPollId(finalPollId);
      if (finalPollId) {
        await loadPollData(finalPollId);
      }
    } catch (error) {
      console.error("Error initializing poll:", error);
    }
  };

  // Load poll data from database
  const loadPollData = async (pollIdToUse: string) => {
    try {
      // Get poll options with vote counts
      const { data: optionsData, error: optionsError } = await supabase
        .from("forum_poll_options")
        .select("*")
        .eq("poll_id", pollIdToUse)
        .order("created_at");

      if (optionsError) {
        console.error("Error loading poll options:", optionsError);
        return;
      }

      setPollOptions(optionsData || []);
      
      // Calculate total votes
      const total = optionsData?.reduce((sum, option) => sum + option.vote_count, 0) || 0;
      setTotalVotes(total);

      // Get user's vote if logged in
      if (user) {
        const { data: voteData, error: voteError } = await supabase
          .from("forum_poll_votes")
          .select("option_id")
          .eq("poll_id", pollIdToUse)
          .eq("user_id", user.id)
          .single();

        if (!voteError && voteData) {
          setUserVote(voteData.option_id);
        }
      }
    } catch (error) {
      console.error("Error loading poll data:", error);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user || loading || !actualPollId) return;

    setLoading(true);

    try {
      // If user already voted, remove previous vote
      if (userVote) {
        const { error: deleteError } = await supabase
          .from("forum_poll_votes")
          .delete()
          .eq("poll_id", actualPollId)
          .eq("user_id", user.id);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Add new vote
      const { error: insertError } = await supabase
        .from("forum_poll_votes")
        .insert({
          poll_id: actualPollId,
          option_id: optionId,
          user_id: user.id
        });

      if (insertError) {
        throw insertError;
      }

      setUserVote(optionId);
      
      // Reload poll data to get updated counts
      await loadPollData(actualPollId);
      
      toast({
        title: "Vote recorded",
        description: "Your vote has been saved successfully."
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize poll on component mount
  useEffect(() => {
    initializePoll();
  }, [pollId, user]);

  const getPercentage = (voteCount: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  };

  // If no poll options loaded yet, show fallback with provided options
  const displayOptions = pollOptions.length > 0 ? pollOptions : options.map((option, index) => ({
    id: `temp-${index}`,
    option_text: option,
    vote_count: 0
  }));

  return (
    <Card className="my-4 border-pink-200">
      <CardHeader>
        <CardTitle className="text-lg">{question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayOptions.map((option) => {
          const percentage = getPercentage(option.vote_count);
          const isSelected = userVote === option.id;
          const canVote = user && actualPollId && !option.id.startsWith('temp-');

          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="flex-1 justify-start text-left h-auto p-3"
                  onClick={() => canVote && handleVote(option.id)}
                  disabled={loading || !canVote}
                >
                  <span className="flex-1">{option.option_text}</span>
                  {totalVotes > 0 && (
                    <span className="ml-2 text-sm">
                      {option.vote_count} ({percentage}%)
                    </span>
                  )}
                </Button>
              </div>
              {totalVotes > 0 && (
                <Progress value={percentage} className="h-2" />
              )}
            </div>
          );
        })}
        
        <div className="text-sm text-muted-foreground mt-4">
          {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
          {!user && " • Sign in to vote"}
          {!actualPollId && " • Poll not yet initialized"}
        </div>
      </CardContent>
    </Card>
  );
};

export default Poll;
