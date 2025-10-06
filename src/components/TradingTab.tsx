
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import TradeOffer from "./TradeOffer";

interface Trade {
  id: string;
  initiator_id: string;
  recipient_id: string;
  status: string;
  initiator_confirmed: boolean;
  recipient_confirmed: boolean;
  created_at: string;
  expires_at: string;
  initiator_profile?: { username: string };
  recipient_profile?: { username: string };
}

const TradingTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  const fetchTrades = async () => {
    if (!user) return;

    try {
      const { data: tradesData, error } = await supabase
        .from("trades")
        .select("*")
        .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch usernames for trades
      const tradesWithProfiles = await Promise.all(
        (tradesData || []).map(async (trade) => {
          const [initiatorProfile, recipientProfile] = await Promise.all([
            supabase.from("profiles").select("username").eq("id", trade.initiator_id).single(),
            supabase.from("profiles").select("username").eq("id", trade.recipient_id).single()
          ]);

          return {
            ...trade,
            initiator_profile: initiatorProfile.data,
            recipient_profile: recipientProfile.data
          };
        })
      );

      setTrades(tradesWithProfiles);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchUsername.trim()) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", searchUsername.trim())
        .single();

      if (error) {
        toast({
          title: "User not found",
          description: "No user found with that username",
          variant: "destructive",
        });
        return;
      }

      if (data.id === user?.id) {
        toast({
          title: "Invalid selection",
          description: "You cannot trade with yourself",
          variant: "destructive",
        });
        return;
      }

      setSelectedRecipient(data);
      setShowNewTrade(true);
      setSearchUsername("");
    } catch (error) {
      console.error("Error searching user:", error);
    }
  };

  const getTradeStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTradeStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showNewTrade && selectedRecipient) {
    return (
      <TradeOffer
        recipient={selectedRecipient}
        onBack={() => {
          setShowNewTrade(false);
          setSelectedRecipient(null);
        }}
        onTradeCreated={() => {
          setShowNewTrade(false);
          setSelectedRecipient(null);
          fetchTrades();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800">Start a New Trade</CardTitle>
          <CardDescription>Search for a user to trade with</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
            />
            <Button onClick={searchUser} className="bg-pink-600 hover:bg-pink-700">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-pink-800">Your Trades</h3>
        
        {trades.map((trade) => (
          <Card key={trade.id} className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getTradeStatusColor(trade.status)} text-white`}>
                      {getTradeStatusIcon(trade.status)}
                      <span className="ml-1 capitalize">{trade.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {trade.initiator_id === user?.id ? 'Trading with' : 'Trade from'}: {' '}
                    <span className="font-medium">
                      {trade.initiator_id === user?.id 
                        ? trade.recipient_profile?.username 
                        : trade.initiator_profile?.username}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(trade.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {trades.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
            <CardContent className="text-center py-8">
              <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No trades yet</p>
              <p className="text-sm text-muted-foreground">Search for a user above to start your first trade!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TradingTab;
