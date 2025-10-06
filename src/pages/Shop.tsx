
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ShopFilters from "@/components/shop/ShopFilters";
import ShopItemList from "@/components/shop/ShopItemList";
import ShopEmptyState from "@/components/shop/ShopEmptyState";
import SpinWheel from "@/components/SpinWheel";
import { useToast } from "@/hooks/use-toast";

const Shop = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .not("name", "ilike", "%litter license%")
        .not("name", "ilike", "%pet food%");
      
      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        console.log("Profile data fetched:", {
          paw_dollars: data.paw_dollars,
          paw_points: data.paw_points,
          full_profile: data
        });
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleWheelSpinComplete = async () => {
    // Always refresh profile data after wheel spin to ensure amounts are current
    console.log("Wheel spin completed, refreshing profile...");
    await fetchProfile();
  };

  const filterItems = () => {
    let filtered = [...items];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.item_type === selectedCategory);
    }

    return filtered;
  };

  const handlePurchase = async (item: any) => {
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please log in to make purchases",
        variant: "destructive",
      });
      return;
    }

    console.log("Attempting to purchase:", item.name);
    console.log("Current profile before purchase:", profile);

    // Check if user has enough currency
    const hasEnoughND = item.price_nd && profile.paw_dollars >= item.price_nd;
    const hasEnoughNP = item.price_np && profile.paw_points >= item.price_np;

    if (!hasEnoughND && !hasEnoughNP) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough currency to purchase this item",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if this is a food item by checking the name and type
      const isFoodBags = item.name.toLowerCase().includes('food') && 
                        (item.item_type === 'consumable' || item.name.toLowerCase().includes('bag'));

      if (isFoodBags) {
        // Determine number of food bags based on item name
        let foodBagsToAdd = 10; // default for "Pet Food" and "Food Bag"
        
        if (item.name.includes("Bundle (20)")) {
          foodBagsToAdd = 20;
        } else if (item.name.includes("Bundle (50)")) {
          foodBagsToAdd = 50;
        } else if (item.name.includes("Bundle (100)")) {
          foodBagsToAdd = 100;
        }
        
        console.log(`Purchasing food bags - adding ${foodBagsToAdd} to profile`);
        
        const newFoodBags = (profile.food_bags || 0) + foodBagsToAdd;
        let newPawDollars = profile.paw_dollars;
        let newPawPoints = profile.paw_points;
        
        if (item.price_nd && hasEnoughND) {
          newPawDollars = profile.paw_dollars - item.price_nd;
        }
        if (item.price_np && hasEnoughNP) {
          newPawPoints = profile.paw_points - item.price_np;
        }

        console.log("Updating profile with:", {
          food_bags: newFoodBags,
          paw_dollars: newPawDollars,
          paw_points: newPawPoints
        });

        // Update profile with new values
        const { data: updatedProfile, error: profileError } = await supabase
          .from("profiles")
          .update({
            food_bags: newFoodBags,
            paw_dollars: newPawDollars,
            paw_points: newPawPoints
          })
          .eq("id", user.id)
          .select()
          .single();

        if (profileError) {
          console.error("Profile update error:", profileError);
          throw profileError;
        }

        console.log("Profile updated successfully:", updatedProfile);

        // Record transaction in pet ledger
        const transactionData: any = {
          user_id: user.id,
          pet_id: user.id, // Using user.id as placeholder since this is a shop purchase
          description: `Purchased ${item.name} from shop (+${foodBagsToAdd} food bags)`
        };

        if (item.price_nd && hasEnoughND) {
          transactionData.paw_dollars = -item.price_nd;
        }
        if (item.price_np && hasEnoughNP) {
          transactionData.paw_points = -item.price_np;
        }

        const { error: transactionError } = await supabase
          .from("pet_transactions")
          .insert(transactionData);

        if (transactionError) {
          console.error("Transaction error:", transactionError);
          throw transactionError;
        }

        // Record in PawDollar ledger if paid with PawDollars
        if (item.price_nd && hasEnoughND) {
          const { error: ledgerError } = await supabase
            .from("paw_dollar_transactions")
            .insert({
              user_id: user.id,
              amount: -item.price_nd,
              type: 'shop_purchase',
              description: `Shop purchase: ${item.name} (+${foodBagsToAdd} food bags)`,
              status: 'completed'
            });

          if (ledgerError) {
            console.error("Ledger error:", ledgerError);
          }
        }

        toast({
          title: "Purchase successful!",
          description: `You have purchased ${item.name} and received ${foodBagsToAdd} food bags!`,
        });

        // Update local profile state immediately to ensure UI reflects changes
        setProfile(updatedProfile);
      } else {
        // Regular item handling - add to inventory
        const { error: inventoryError } = await supabase
          .from("user_inventory_items")
          .insert({
            user_id: user.id,
            shop_item_id: item.id,
            quantity: 1,
          });

        if (inventoryError) throw inventoryError;

        // Deduct currency from user profile
        const updates: any = {};
        if (item.price_nd && hasEnoughND) {
          updates.paw_dollars = profile.paw_dollars - item.price_nd;
        }
        if (item.price_np && hasEnoughNP) {
          updates.paw_points = profile.paw_points - item.price_np;
        }

        const { data: updatedProfile, error: profileError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (profileError) throw profileError;

        // Record transaction in pet ledger
        const transactionData: any = {
          user_id: user.id,
          pet_id: user.id,
          description: `Purchased ${item.name} from shop`
        };

        if (item.price_nd && hasEnoughND) {
          transactionData.paw_dollars = -item.price_nd;
        }
        if (item.price_np && hasEnoughNP) {
          transactionData.paw_points = -item.price_np;
        }

        const { error: transactionError } = await supabase
          .from("pet_transactions")
          .insert(transactionData);

        if (transactionError) throw transactionError;

        // Record in PawDollar ledger if paid with PawDollars
        if (item.price_nd && hasEnoughND) {
          const { error: ledgerError } = await supabase
            .from("paw_dollar_transactions")
            .insert({
              user_id: user.id,
              amount: -item.price_nd,
              type: 'shop_purchase',
              description: `Shop purchase: ${item.name}`,
              status: 'completed'
            });

          if (ledgerError) {
            console.error("Ledger error:", ledgerError);
          }
        }

        toast({
          title: "Purchase successful!",
          description: `You have purchased ${item.name}`,
        });

        // Update local profile state immediately
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      toast({
        title: "Error",
        description: "Failed to purchase item",
        variant: "destructive",
      });
      // Refresh profile to ensure UI shows correct amounts even if purchase failed
      await fetchProfile();
    }
  };

  const getDisplayItem = (item: any) => {
    return item;
  };

  const filteredItems = filterItems();
  const categories = ["all", ...Array.from(new Set(items.map((item: any) => item.item_type)))];

  console.log("Shop render - Profile state:", {
    hasProfile: !!profile,
    paw_dollars: profile?.paw_dollars,
    paw_points: profile?.paw_points
  });

  return (
    <ProfileLayout>
      {/* Enhanced Shop Header with better visibility */}
      <div className="bg-white/95 backdrop-blur-sm border border-pink-200 rounded-xl shadow-xl p-8 mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-pink-800 mb-4">🛍️ PawPets Shop</h1>
          <p className="text-xl text-pink-600 mb-6">
            Discover amazing items for your beloved pets!
          </p>
          <div className="flex justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-3 rounded-lg shadow-md">
              <span className="font-semibold text-yellow-800">💰 Your Paw Dollars:</span>
              <span className="text-2xl font-bold text-yellow-600">{profile?.paw_dollars || 0}</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-100 px-4 py-3 rounded-lg shadow-md">
              <span className="font-semibold text-purple-800">✨ Your Paw Points:</span>
              <span className="text-2xl font-bold text-purple-600">{profile?.paw_points || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Wheel Section */}
      <div className="mb-8">
        <SpinWheel onSpinComplete={handleWheelSpinComplete} profile={profile} />
      </div>

      <div className="space-y-6">
        <ShopFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          profile={profile}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-lg text-pink-600">Loading shop items...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <ShopItemList 
            items={filteredItems} 
            profile={profile}
            onPurchase={handlePurchase}
            getDisplayItem={getDisplayItem}
          />
        ) : (
          <ShopEmptyState />
        )}
      </div>
    </ProfileLayout>
  );
};

export default Shop;
