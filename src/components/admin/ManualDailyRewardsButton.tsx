
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, Gift } from "lucide-react";

const ManualDailyRewardsButton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const triggerDailyRewards = async () => {
    setIsProcessing(true);
    try {
      console.log("🚀 Manually triggering automated daily rewards...");
      
      const { data, error } = await supabase.functions.invoke('automated-daily-rewards', {
        body: {}
      });

      if (error) {
        console.error("❌ Manual trigger failed:", error);
        toast({
          title: "Failed to Trigger Rewards",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Manual trigger results:", data);
      
      toast({
        title: "Daily Rewards Triggered! 🎉",
        description: data.message || "Daily rewards have been processed successfully",
        duration: 5000,
      });

      if (data.data) {
        const details = data.data;
        console.log("📊 Processing details:", details);
        
        toast({
          title: "Processing Complete",
          description: `Processed: ${details.users_processed} users, Rewarded: ${details.users_rewarded}, Errors: ${details.errors_count || 0}`,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error("❌ Manual trigger error:", error);
      toast({
        title: "Trigger Error",
        description: "Failed to manually trigger daily rewards",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Trigger Automated Daily Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={triggerDailyRewards} 
          disabled={isProcessing}
          className="w-full"
          variant="default"
        >
          <Play className="h-4 w-4 mr-2" />
          {isProcessing ? "Processing..." : "Run Automated Daily Rewards"}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          This will run the same automated process that executes nightly at 12:01 AM UTC. 
          It processes all eligible users and logs the results in the daily_rewards_log table.
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualDailyRewardsButton;
