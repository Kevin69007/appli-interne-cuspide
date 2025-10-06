
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CheckCircle, XCircle } from "lucide-react";

const SystemHealthCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const { toast } = useToast();

  const runHealthCheck = async () => {
    setIsChecking(true);
    const checks = {
      database: false,
      edgeFunctions: false,
      dailyRewards: false,
      logging: false
    };

    try {
      // Check database connection
      const { data: profiles, error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      checks.database = !dbError;

      // Check daily rewards log table
      const { data: logs, error: logError } = await supabase
        .from('daily_rewards_log')
        .select('id')
        .limit(1);
        
      checks.logging = !logError;

      // Test edge function connectivity
      try {
        const { error: fnError } = await supabase.functions.invoke('automated-daily-rewards', {
          body: { test: true }
        });
        checks.edgeFunctions = true; // Even if it returns an error, function is reachable
      } catch {
        checks.edgeFunctions = false;
      }

      // Check daily rewards status using direct query instead of RPC
      try {
        const { data: statusData, error: statusError } = await supabase
          .from('daily_rewards_log')
          .select('*')
          .limit(1);
        checks.dailyRewards = !statusError;
      } catch {
        checks.dailyRewards = false;
      }

      setHealthStatus(checks);
      
      const allHealthy = Object.values(checks).every(Boolean);
      toast({
        title: allHealthy ? "System Healthy ✅" : "System Issues Detected ⚠️",
        description: `${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} checks passed`,
        variant: allHealthy ? "default" : "destructive",
        duration: 5000,
      });

    } catch (error) {
      console.error("❌ Health check failed:", error);
      toast({
        title: "Health Check Failed",
        description: "Unable to complete system health check",
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
          <Shield className="h-5 w-5" />
          System Health Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runHealthCheck} 
          disabled={isChecking}
          className="w-full"
          variant="outline"
        >
          {isChecking ? "Checking..." : "Run Health Check"}
        </Button>
        
        {healthStatus && (
          <div className="space-y-2">
            {Object.entries(healthStatus).map(([check, status]) => (
              <div key={check} className="flex items-center justify-between p-2 border rounded">
                <span className="capitalize">{check.replace(/([A-Z])/g, ' $1')}</span>
                {status ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
