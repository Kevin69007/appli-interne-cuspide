
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";

const TestDailyRewardsButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  const runTest = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Testing daily rewards system...");
      
      const { data, error } = await supabase.functions.invoke('daily-rewards-test', {
        body: {}
      });

      if (error) {
        console.error("❌ Test failed:", error);
        toast({
          title: "Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Test results:", data);
      setTestResults(data);

      if (data.recommendations && data.recommendations.length > 0) {
        toast({
          title: "Issues Found",
          description: `Found ${data.recommendations.length} recommendations`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "System Check Complete",
          description: "Daily rewards system appears to be working correctly",
        });
      }
    } catch (error) {
      console.error("❌ Test error:", error);
      toast({
        title: "Test Error",
        description: "Failed to run daily rewards test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Test Daily Rewards System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={isLoading} className="w-full">
          {isLoading ? "Testing..." : "Run System Test"}
        </Button>
        
        {testResults && (
          <div className="space-y-3 mt-4">
            <div className="text-sm font-medium">Test Results:</div>
            
            {testResults.system_status && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {testResults.system_status.rewards_executed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-600" />
                  )}
                  <span className="text-sm">
                    Rewards executed today: {testResults.system_status.rewards_executed ? "Yes" : "No"}
                  </span>
                </div>
                
                {testResults.system_status.users_without_rewards > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      Users needing rewards: {testResults.system_status.users_without_rewards}
                    </span>
                  </div>
                )}
              </div>
            )}

            {testResults.recommendations && testResults.recommendations.length > 0 && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="text-sm font-medium text-orange-800 mb-2">Recommendations:</div>
                <ul className="text-sm text-orange-700 space-y-1">
                  {testResults.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Test date: {testResults.test_date} | 
              Cron active: {testResults.cron_job_active ? "Yes" : "No"} |
              Recent logs: {testResults.recent_logs?.length || 0}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestDailyRewardsButton;
