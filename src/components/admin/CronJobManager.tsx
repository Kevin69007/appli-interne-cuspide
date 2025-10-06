
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Settings, CheckCircle, AlertCircle } from "lucide-react";

const CronJobManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cronStatus, setCronStatus] = useState<any>(null);
  const { toast } = useToast();

  const setupCronJob = async () => {
    setIsLoading(true);
    try {
      console.log("🕐 Setting up daily rewards cron job...");
      
      const { data, error } = await supabase.functions.invoke('setup-daily-rewards-cron', {
        body: {}
      });

      if (error) {
        console.error("❌ Cron setup failed:", error);
        toast({
          title: "Failed to Setup Cron Job",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Cron job setup results:", data);
      
      toast({
        title: "Cron Job Scheduled! ⏰",
        description: "Daily rewards will now run automatically at 12:01 AM UTC every day",
        duration: 5000,
      });

    } catch (error) {
      console.error("❌ Cron setup error:", error);
      toast({
        title: "Setup Error",
        description: "Failed to setup automated daily rewards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRewardsStatus = async () => {
    setIsChecking(true);
    try {
      console.log("🔍 Checking daily rewards status...");
      
      // Use a direct query instead of RPC to avoid type issues
      const { data, error } = await supabase
        .from('daily_rewards_log')
        .select('*')
        .eq('execution_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("❌ Status check failed:", error);
        toast({
          title: "Status Check Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Get count of users without rewards today
      const { count: usersWithoutRewards } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .or(`last_daily_reward_date.is.null,last_daily_reward_date.neq.${new Date().toISOString().split('T')[0]}`)
        .eq('is_banned', false);

      const statusData = {
        rewards_executed: data && data.length > 0 && data[0].status === 'completed',
        users_without_rewards: usersWithoutRewards || 0,
        last_execution_date: data && data.length > 0 ? data[0].execution_date : null,
        last_execution_status: data && data.length > 0 ? data[0].status : null
      };

      setCronStatus(statusData);
      console.log("📊 Rewards status:", statusData);
      
      toast({
        title: "Daily Rewards Status",
        description: `${statusData.rewards_executed ? 'Executed' : 'Not executed'} today. ${statusData.users_without_rewards} users pending rewards.`,
        duration: 4000,
      });

    } catch (error) {
      console.error("❌ Status check error:", error);
      toast({
        title: "Check Error",
        description: "Failed to check daily rewards status",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Daily Rewards Automation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={setupCronJob} 
            disabled={isLoading}
            className="flex-1"
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isLoading ? "Setting up..." : "Setup Automated Daily Rewards"}
          </Button>
          
          <Button 
            onClick={checkRewardsStatus} 
            disabled={isChecking}
            variant="secondary"
          >
            {isChecking ? "Checking..." : "Check Status"}
          </Button>
        </div>
        
        {cronStatus && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {cronStatus.rewards_executed ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="font-medium">
                {cronStatus.rewards_executed ? "Rewards Executed Today" : "Rewards Pending"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Users without rewards: {cronStatus.users_without_rewards}</div>
              <div>Last execution: {cronStatus.last_execution_date || 'Never'}</div>
              <div>Status: {cronStatus.last_execution_status || 'None'}</div>
            </div>
          </div>
        )}
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="font-medium">Automation Details:</div>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Runs daily at 12:01 AM UTC</li>
            <li>Processes all eligible users automatically</li>
            <li>Logs results in daily_rewards_log table</li>
            <li>Handles errors gracefully without stopping</li>
            <li>No user authentication required</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CronJobManager;
