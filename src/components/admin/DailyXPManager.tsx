
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Plus } from "lucide-react";

export const DailyXPManager = () => {
  const [xpAmount, setXpAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addDailyXP = async () => {
    if (!xpAmount || isNaN(Number(xpAmount))) {
      toast({
        title: "Invalid XP Amount",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // This would need to be implemented based on your XP system
      toast({
        title: "Feature Coming Soon",
        description: "Daily XP management will be implemented",
      });
    } catch (error) {
      console.error("Error adding daily XP:", error);
      toast({
        title: "Error",
        description: "Failed to add daily XP",
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
          <Trophy className="h-5 w-5" />
          Daily XP Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="XP Amount"
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
          />
          <Button onClick={addDailyXP} disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Adding..." : "Add XP"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Manage daily XP rewards and bonuses for users.
        </div>
      </CardContent>
    </Card>
  );
};
