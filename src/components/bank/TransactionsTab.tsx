import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Coins, Star, Heart, RefreshCw, Gift, Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentRecoverySection from "./PaymentRecoverySection";

const TransactionsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [petTransactions, setPetTransactions] = useState<any[]>([]);
  const [pawDollarTransactions, setPawDollarTransactions] = useState<any[]>([]);
  const [xpTransactions, setXpTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllTransactions();
    }
  }, [user]);

  const fetchAllTransactions = async () => {
    if (!user) return;
    
    try {
      // Fetch pet transactions with enhanced data
      const { data: petData, error: petError } = await supabase
        .from("pet_transactions")
        .select(`
          *,
          user_pets!pet_transactions_pet_id_fkey (
            pet_name,
            user_id,
            profiles!user_pets_user_id_fkey (username)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (petError) throw petError;

      // Fetch paw dollar transactions with enhanced data for pet sales/purchases
      const { data: pawData, error: pawError } = await supabase
        .from("paw_dollar_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pawError) throw pawError;

      // Enhance paw dollar transactions with pet/user info for pet-related transactions
      const enhancedPawData = await Promise.all(
        (pawData || []).map(async (transaction) => {
          if (transaction.type === 'pet_purchase' || transaction.type === 'pet_sale') {
            // Try to extract pet name from description
            const petNameMatch = transaction.description.match(/pet (.+?)(?:\s|$)/);
            if (petNameMatch) {
              (transaction as any).extracted_pet_name = petNameMatch[1];
            }
            
            // For pet sales, try to find the buyer from pet_transactions
            if (transaction.type === 'pet_sale') {
              const { data: relatedTransaction } = await supabase
                .from("pet_transactions")
                .select(`
                  *,
                  profiles!pet_transactions_user_id_fkey (username)
                `)
                .eq("description", transaction.description.replace('Sold', 'Purchased'))
                .neq("user_id", user.id)
                .single();
              
              if (relatedTransaction) {
                (transaction as any).other_user = relatedTransaction.profiles;
              }
            }
            
            // For pet purchases, try to find the seller
            if (transaction.type === 'pet_purchase') {
              const { data: relatedTransaction } = await supabase
                .from("pet_transactions")
                .select(`
                  *,
                  profiles!pet_transactions_user_id_fkey (username)
                `)
                .eq("description", transaction.description.replace('Purchased', 'Sold'))
                .neq("user_id", user.id)
                .single();
              
              if (relatedTransaction) {
                (transaction as any).other_user = relatedTransaction.profiles;
              }
            }
          }
          return transaction;
        })
      );

      // Fetch XP transactions
      const { data: xpData, error: xpError } = await supabase
        .from("xp_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (xpError) {
        console.error("Error fetching XP transactions:", xpError);
        setXpTransactions([]);
      } else {
        setXpTransactions(xpData || []);
      }

      console.log('🏦 Enhanced Bank transactions fetched:', {
        petTransactions: petData?.length || 0,
        pawDollarTransactions: enhancedPawData?.length || 0,
        xpTransactions: xpData?.length || 0
      });

      setPetTransactions(petData || []);
      setPawDollarTransactions(enhancedPawData || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    setRefreshing(true);
    await fetchAllTransactions();
    setRefreshing(false);
    toast({
      title: "Transactions Refreshed",
      description: "Transaction history has been updated.",
    });
  };

  // Filter pet transactions by currency type
  const petPawDollarTransactions = petTransactions.filter(t => t.paw_dollars !== null);
  const petPawPointTransactions = petTransactions.filter(t => t.paw_points !== null);

  // Combine pet transactions with regular paw dollar transactions
  const allPawDollarTransactions = [...petPawDollarTransactions, ...pawDollarTransactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Check for stuck pending transactions
  const pendingTransactions = pawDollarTransactions.filter(t => t.status === 'pending');
  const hasPendingTransactions = pendingTransactions.length > 0;

  const getTransactionIcon = (transaction: any, transactionType?: 'xp' | 'dollars' | 'points') => {
    if (transactionType === 'xp') {
      return <Zap className="w-4 h-4 text-pink-500" />;
    }

    const isPetTransaction = 'pet_id' in transaction;
    if (isPetTransaction) return <Heart className="w-4 h-4 text-pink-500" />;
    
    if (transaction.type === 'gift_sent' || transaction.type === 'gift_received') {
      return <Gift className="w-4 h-4 text-green-500" />;
    }
    
    return null;
  };

  const getTransactionTypeLabel = (transaction: any, transactionType?: 'xp' | 'dollars' | 'points') => {
    if (transactionType === 'xp') {
      return `XP Gain - ${transaction.activity_type || 'Activity'}`;
    }

    const isPetTransaction = 'pet_id' in transaction;
    if (isPetTransaction) return "Pet Transaction";
    
    switch (transaction.type) {
      case 'gift_sent':
        return "Gift Sent";
      case 'gift_received':
        return "Gift Received";
      case 'purchase':
        return "Purchase";
      case 'shop_purchase':
        return "Shop Purchase";
      case 'pet_purchase':
        return "Pet Purchase";
      case 'pet_sale':
        return "Pet Sale";
      case 'daily_reward':
        return "Daily Reward";
      case 'pawclub_daily':
        return "PawClub Daily Bonus";
      default:
        return transaction.type ? transaction.type.replace('_', ' ').toUpperCase() : "Transaction";
    }
  };

  const getEnhancedDescription = (transaction: any, currencyType: 'dollars' | 'points' | 'xp') => {
    const isPetTransaction = 'pet_id' in transaction;
    
    if (isPetTransaction && transaction.user_pets) {
      const petName = transaction.user_pets.pet_name;
      const otherUserName = transaction.user_pets.profiles?.username;
      
      if (transaction.description.includes('Purchased') && otherUserName) {
        return `Purchased ${petName} from ${otherUserName}`;
      } else if (transaction.description.includes('Sold') && otherUserName) {
        return `Sold ${petName} to ${otherUserName}`;
      }
    }
    
    // For paw dollar transactions with pet info - using optional chaining
    if (currencyType === 'dollars' && (transaction.type === 'pet_purchase' || transaction.type === 'pet_sale')) {
      let description = transaction.description;
      
      const extractedPetName = (transaction as any).extracted_pet_name;
      if (extractedPetName) {
        description = description.replace(extractedPetName, `${extractedPetName}`);
      }
      
      const otherUser = (transaction as any).other_user;
      if (otherUser?.username) {
        if (transaction.type === 'pet_purchase') {
          description += ` from ${otherUser.username}`;
        } else if (transaction.type === 'pet_sale') {
          description += ` to ${otherUser.username}`;
        }
      }
      
      return description;
    }
    
    return transaction.description;
  };

  const renderTransactionList = (transactionList: any[], currencyType: 'dollars' | 'points' | 'xp') => {
    if (transactionList.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">
          No {currencyType === 'dollars' ? 'Paw Dollar' : currencyType === 'points' ? 'Paw Point' : 'XP'} transactions recorded yet.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {transactionList.map((transaction) => {
          const isPetTransaction = 'pet_id' in transaction;
          const amount = currencyType === 'dollars' 
            ? (transaction.paw_dollars || transaction.amount)
            : currencyType === 'points' 
              ? transaction.paw_points
              : transaction.xp_amount;
          
          const isStuckPending = transaction.status === 'pending' && 
            new Date(transaction.created_at) < new Date(Date.now() - 10 * 60 * 1000); // 10 minutes old
          
          return (
            <div key={transaction.id} className={`p-4 border rounded-lg transition-colors ${
              isStuckPending ? 'bg-orange-50 border-orange-200' : 'bg-white hover:bg-gray-50'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction, currencyType)}
                    {isStuckPending && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    <p className="font-medium text-gray-900">{getEnhancedDescription(transaction, currencyType)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()} at{' '}
                    {new Date(transaction.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-pink-600 mt-1">{getTransactionTypeLabel(transaction, currencyType)}</p>
                  {isStuckPending && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ This transaction appears stuck. Try the Payment Recovery tool above.
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {currencyType === 'dollars' && amount && (
                    <Badge 
                      variant={amount > 0 ? "default" : "destructive"}
                      className="ml-2"
                    >
                      <Coins className="w-3 h-3 mr-1" />
                      {amount > 0 ? "+" : ""}{amount} PD
                    </Badge>
                  )}
                  {currencyType === 'points' && amount && (
                    <Badge 
                      variant={amount > 0 ? "secondary" : "destructive"}
                      className="ml-2"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {amount > 0 ? "+" : ""}{amount} PP
                    </Badge>
                  )}
                  {currencyType === 'xp' && amount && (
                    <Badge 
                      variant="outline"
                      className="ml-2 border-pink-200 text-pink-700"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      +{amount} XP
                    </Badge>
                  )}
                  {!isPetTransaction && transaction.status && currencyType !== 'xp' && (
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 
                              transaction.status === 'failed' ? 'destructive' : 
                              isStuckPending ? 'outline' : 'secondary'} 
                      className="text-xs ml-2"
                    >
                      {transaction.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-pink-800">
              <Receipt className="w-5 h-5" />
              Transaction Ledger
            </CardTitle>
            <Button
              onClick={refreshTransactions}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paw-dollars" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paw-dollars" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Paw Dollars ({allPawDollarTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="paw-points" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Paw Points ({petPawPointTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="xp" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                XP ({xpTransactions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="paw-dollars" className="mt-4">
              {renderTransactionList(allPawDollarTransactions, 'dollars')}
            </TabsContent>
            
            <TabsContent value="paw-points" className="mt-4">
              {renderTransactionList(petPawPointTransactions, 'points')}
            </TabsContent>
            
            <TabsContent value="xp" className="mt-4">
              {renderTransactionList(xpTransactions, 'xp')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsTab;
