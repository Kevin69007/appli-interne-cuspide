import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Coins, Star, Heart, Gift, Zap } from "lucide-react";

// Enhanced transaction type for paw dollar transactions
interface EnhancedPawDollarTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
  pet_name?: string;
  other_user?: { username?: string };
  other_username?: string;
}

const LedgerTab = () => {
  const { user } = useAuth();
  const [petTransactions, setPetTransactions] = useState<any[]>([]);
  const [pawDollarTransactions, setPawDollarTransactions] = useState<EnhancedPawDollarTransaction[]>([]);
  const [xpTransactions, setXpTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllTransactions();
    }
  }, [user]);

  const fetchAllTransactions = async () => {
    if (!user) return;
    
    try {
      console.log('📊 Fetching transactions for user:', user.id);
      
      // Fetch pet transactions with enhanced data and fallback strategy
      let petData: any[] = [];
      try {
        const { data: complexPetData, error: complexError } = await supabase
          .from("pet_transactions")
          .select(`
            *,
            user_pets!inner(
              pet_name,
              user_id,
              profiles!inner(username)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (complexError) {
          console.warn("❌ Complex pet query failed, trying fallback:", complexError);
          const { data: simplePetData, error: simpleError } = await supabase
            .from("pet_transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (simpleError) {
            console.error("❌ Fallback pet query also failed:", simpleError);
            setPetTransactions([]);
          } else {
            console.log('✅ Pet transactions fetched (simple fallback):', simplePetData?.length || 0);
            petData = simplePetData || [];
          }
        } else {
          console.log('✅ Pet transactions fetched (with joins):', complexPetData?.length || 0);
          petData = complexPetData || [];
        }
      } catch (error) {
        console.error("❌ CRITICAL: Error in pet transactions fetch:", error);
        petData = [];
      }

      // Fetch paw dollar transactions with enhanced user information
      let enhancedPawData: EnhancedPawDollarTransaction[] = [];
      try {
        const { data: pawData, error: pawError } = await supabase
          .from("paw_dollar_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (pawError) {
          console.error("❌ Error fetching paw dollar transactions:", pawError);
          setPawDollarTransactions([]);
        } else {
          console.log('✅ Paw dollar transactions fetched:', pawData?.length || 0);
          
          // Enhance paw dollar transactions with additional context
          enhancedPawData = await Promise.all(
            (pawData || []).map(async (transaction): Promise<EnhancedPawDollarTransaction> => {
              let enhancedTransaction: EnhancedPawDollarTransaction = { ...transaction };
              
              // For pet-related transactions, try to extract and enhance pet info
              if (transaction.type === 'pet_purchase' || transaction.type === 'pet_sale' || transaction.type === 'pet_adoption') {
                // Try to find related pet transaction for more context
                try {
                  const { data: relatedPetTransaction, error: petTransactionError } = await supabase
                    .from("pet_transactions")
                    .select(`
                      *,
                      user_pets(pet_name, user_id, profiles(username))
                    `)
                    .eq("user_id", transaction.type === 'pet_sale' ? user.id : user.id)
                    .eq("description", transaction.description)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  
                  // Only access properties if query was successful and data exists with proper structure
                  if (!petTransactionError && relatedPetTransaction && typeof relatedPetTransaction === 'object' && 'user_pets' in relatedPetTransaction && relatedPetTransaction.user_pets) {
                    const userPets = relatedPetTransaction.user_pets as any;
                    if (userPets.pet_name) {
                      enhancedTransaction.pet_name = userPets.pet_name;
                    }
                    if (userPets.profiles && userPets.profiles.username) {
                      enhancedTransaction.other_user = { username: userPets.profiles.username };
                    }
                  }
                } catch (error) {
                  console.warn("Could not enhance pet transaction:", error);
                }
              }
              
              // For gift transactions, try to extract recipient/sender info
              if (transaction.type === 'gift_sent' || transaction.type === 'gift_received') {
                // Extract username from description if possible
                const usernameMatch = transaction.description.match(/(from|to)\s+(\w+)/);
                if (usernameMatch) {
                  enhancedTransaction.other_username = usernameMatch[2];
                }
              }
              
              return enhancedTransaction;
            })
          );
        }
      } catch (error) {
        console.error("❌ CRITICAL: Error in paw dollar transactions fetch:", error);
        enhancedPawData = [];
      }

      // Fetch XP transactions
      const { data: xpData, error: xpError } = await supabase
        .from("xp_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (xpError) {
        console.error("❌ Error fetching XP transactions:", xpError);
        setXpTransactions([]);
      } else {
        console.log('✅ XP transactions fetched:', xpData?.length || 0);
        setXpTransactions(xpData || []);
      }

      console.log('📊 Final transaction counts:', {
        petTransactions: petData.length,
        pawDollarTransactions: enhancedPawData.length,
        xpTransactions: xpData?.length || 0
      });

      setPetTransactions(petData);
      setPawDollarTransactions(enhancedPawData);

    } catch (error) {
      console.error("❌ CRITICAL: Error in fetchAllTransactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter pet transactions by currency type
  const petPawDollarTransactions = petTransactions.filter(t => t.paw_dollars !== null && t.paw_dollars !== 0);
  const petPawPointTransactions = petTransactions.filter(t => t.paw_points !== null && t.paw_points !== 0);

  // Combine pet transactions with regular paw dollar transactions
  const allPawDollarTransactions = [...petPawDollarTransactions, ...pawDollarTransactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  console.log('📊 Final ledger display counts:', {
    allPawDollarTransactions: allPawDollarTransactions.length,
    petPawPointTransactions: petPawPointTransactions.length,
    xpTransactions: xpTransactions.length
  });

  const getTransactionIcon = (transaction: any, transactionType: 'xp' | 'dollars' | 'points') => {
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

  const getTransactionTypeLabel = (transaction: any, transactionType: 'xp' | 'dollars' | 'points') => {
    if (transactionType === 'xp') {
      return `XP Gain - ${transaction.activity_type || 'Activity'}`;
    }

    const isPetTransaction = 'pet_id' in transaction;
    if (isPetTransaction) return "Pet Care";
    
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
      case 'pet_adoption':
        return "Pet Adoption";
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
    
    // For pet transactions with joined data
    if (isPetTransaction && transaction.user_pets) {
      const petName = transaction.user_pets.pet_name;
      const ownerUsername = transaction.user_pets.profiles?.username;
      
      if (petName) {
        // Enhanced pet transaction descriptions
        if (transaction.description.includes('Fed')) {
          return `Fed ${petName} (+${Math.abs(transaction.paw_points || 0)} Paw Points)`;
        } else if (transaction.description.includes('Watered')) {
          return `Watered ${petName} (+${Math.abs(transaction.paw_points || 0)} Paw Points)`;
        } else if (transaction.description.includes('Purchased') && ownerUsername) {
          return `Purchased ${petName} from ${ownerUsername}`;
        } else if (transaction.description.includes('Sold') && ownerUsername) {
          return `Sold ${petName} to ${ownerUsername}`;
        }
      }
    }
    
    // For paw dollar transactions with enhanced data
    if (currencyType === 'dollars') {
      let description = transaction.description;
      
      // Enhanced descriptions for pet-related paw dollar transactions
      if (transaction.pet_name) {
        if (transaction.type === 'pet_purchase' && transaction.other_user?.username) {
          return `Purchased ${transaction.pet_name} from ${transaction.other_user.username} (-${Math.abs(transaction.amount)} PD)`;
        } else if (transaction.type === 'pet_sale' && transaction.other_user?.username) {
          return `Sold ${transaction.pet_name} to ${transaction.other_user.username} (+${Math.abs(transaction.amount)} PD)`;
        } else if (transaction.type === 'pet_adoption') {
          return `Adopted ${transaction.pet_name} from Shelter (-${Math.abs(transaction.amount)} PD)`;
        }
      }
      
      // Enhanced descriptions for gift transactions
      if (transaction.other_username) {
        if (transaction.type === 'gift_sent') {
          return `Gift sent to ${transaction.other_username} (-${Math.abs(transaction.amount)} PD)`;
        } else if (transaction.type === 'gift_received') {
          return `Gift received from ${transaction.other_username} (+${Math.abs(transaction.amount)} PD)`;
        }
      }
      
      // For shelter transactions
      if (transaction.type === 'pet_adoption' && description.includes('Shelter')) {
        return description.replace('adoption center', 'Shelter');
      }
      
      return description;
    }
    
    return transaction.description;
  };

  const renderTransactionList = (transactionList: any[], currencyType: 'dollars' | 'points' | 'xp') => {
    console.log(`📊 Rendering ${currencyType} transactions:`, transactionList.length);
    
    if (transactionList.length === 0) {
      const currencyName = currencyType === 'dollars' ? 'Paw Dollar' : 
                          currencyType === 'points' ? 'Paw Point' : 'XP';
      return (
        <p className="text-muted-foreground text-center py-8">
          No {currencyName} transactions recorded yet.
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
          
          return (
            <div key={transaction.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction, currencyType)}
                    <p className="font-medium text-gray-900">{getEnhancedDescription(transaction, currencyType)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()} at{' '}
                    {new Date(transaction.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-pink-600 mt-1">{getTransactionTypeLabel(transaction, currencyType)}</p>
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
                              transaction.status === 'failed' ? 'destructive' : 'secondary'} 
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
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Receipt className="w-5 h-5" />
            Transaction Ledger
          </CardTitle>
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

export default LedgerTab;
