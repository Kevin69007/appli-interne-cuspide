
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RetroactiveRewardsButton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState("2025-01-08"); // 6 days ago from today (2025-01-14)
  const [endDate, setEndDate] = useState("2025-01-13"); // Yesterday
  const { toast } = useToast();

  const handleRetroactiveRewards = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before or equal to end date",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to process retroactive rewards from ${startDate} to ${endDate}? This will give missed daily rewards to all eligible users.`)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🔄 Starting retroactive rewards processing...');
      
      const { data, error } = await supabase.functions.invoke('retroactive-rewards', {
        body: { 
          start_date: startDate,
          end_date: endDate
        }
      });

      if (error) {
        console.error('❌ Retroactive rewards error:', error);
        throw error;
      }

      console.log('✅ Retroactive rewards response:', data);

      if (data?.success) {
        toast({
          title: "Retroactive Rewards Complete! 🎉",
          description: data.message,
          duration: 8000,
        });
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('❌ Error processing retroactive rewards:', error);
      toast({
        title: "Retroactive Rewards Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
      <div>
        <h3 className="text-lg font-semibold text-yellow-800">Retroactive Daily Rewards</h3>
        <p className="text-sm text-yellow-700 mt-1">
          Give missed daily rewards to users for a specific date range
        </p>
        <div className="mt-2 text-xs text-yellow-600">
          <p>• Default range covers the past 6 days (when daily rewards were broken)</p>
          <p>• Each user gets: 1000 PP per day, PawClub members also get 10 PD per day</p>
          <p>• Only processes users who haven't received rewards for those dates</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isProcessing}
          />
        </div>
        <div>
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isProcessing}
          />
        </div>
      </div>
      
      <Button 
        onClick={handleRetroactiveRewards}
        disabled={isProcessing}
        className="bg-yellow-600 hover:bg-yellow-700 text-white"
      >
        {isProcessing ? 'Processing...' : 'Process Retroactive Rewards'}
      </Button>
    </div>
  );
};

export default RetroactiveRewardsButton;
