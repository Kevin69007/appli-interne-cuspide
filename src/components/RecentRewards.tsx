
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coins, Zap, Clock } from "lucide-react";

interface RecentTransaction {
  id: string;
  description: string;
  paw_points?: number;
  created_at: string;
}

interface RecentXPTransaction {
  id: string;
  description: string;
  xp_amount: number;
  created_at: string;
}

const RecentRewards = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [xpTransactions, setXpTransactions] = useState<RecentXPTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentRewards();
    }
  }, [user]);

  const fetchRecentRewards = async () => {
    try {
      setLoading(true);

      // Fetch recent paw points transactions
      const { data: pawPointsData, error: pawPointsError } = await supabase
        .from("pet_transactions")
        .select("id, description, paw_points, created_at")
        .eq("user_id", user?.id)
        .not("paw_points", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (pawPointsError) {
        console.error("Error fetching paw points transactions:", pawPointsError);
      } else {
        setTransactions(pawPointsData || []);
      }

      // Fetch recent XP transactions
      const { data: xpData, error: xpError } = await supabase
        .from("xp_transactions")
        .select("id, description, xp_amount, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (xpError) {
        console.error("Error fetching XP transactions:", xpError);
      } else {
        setXpTransactions(xpData || []);
      }
    } catch (error) {
      console.error("Error fetching recent rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading recent rewards...</div>
        </CardContent>
      </Card>
    );
  }

  const hasRecentActivity = transactions.length > 0 || xpTransactions.length > 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Rewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRecentActivity ? (
          <div className="text-center text-gray-500 py-4">
            No recent rewards. Start feeding and watering your pets to earn rewards!
          </div>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {/* Recent XP Transactions */}
              {xpTransactions.map((xp) => (
                <div key={`xp-${xp.id}`} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">{xp.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      +{xp.xp_amount} XP
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(xp.created_at)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Recent Paw Points Transactions */}
              {transactions.map((transaction) => (
                <div key={`pp-${transaction.id}`} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">{transaction.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      +{transaction.paw_points} PP
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(transaction.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentRewards;
