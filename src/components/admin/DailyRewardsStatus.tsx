
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Users, Calendar, AlertTriangle } from "lucide-react";

interface RewardsLog {
  id: string;
  execution_date: string;
  status: string;
  trigger_source: string;
  users_processed: number;
  users_rewarded: number;
  errors_count: number;
  created_at: string;
  completed_at: string;
}

const DailyRewardsStatus = () => {
  const [rewardsLogs, setRewardsLogs] = useState<RewardsLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRewardsLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_rewards_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("❌ Failed to fetch rewards logs:", error);
        toast({
          title: "Failed to Load Logs",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setRewardsLogs(data || []);
    } catch (error) {
      console.error("❌ Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewardsLogs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Daily Rewards Execution Log
        </CardTitle>
        <Button 
          onClick={fetchRewardsLogs} 
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {rewardsLogs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No execution logs found. The automated system hasn't run yet.
          </div>
        ) : (
          <div className="space-y-3">
            {rewardsLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{log.execution_date}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {log.trigger_source}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>Processed: {log.users_processed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-green-600" />
                    <span>Rewarded: {log.users_rewarded}</span>
                  </div>
                  {log.errors_count > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      <span>Errors: {log.errors_count}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Started: {new Date(log.created_at).toLocaleString()}
                  {log.completed_at && (
                    <> • Completed: {new Date(log.completed_at).toLocaleString()}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyRewardsStatus;
