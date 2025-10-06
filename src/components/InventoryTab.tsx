
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const InventoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInventoryItems();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("food_bags, water_bags")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchInventoryItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_inventory_items")
        .select(`
          *,
          shop_items (
            id,
            name,
            description,
            image_url,
            item_type
          )
        `)
        .eq("user_id", user.id)
        .order("acquired_at", { ascending: false });

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Items (Food and Water Bags) */}
      {profile && (profile.food_bags > 0 || profile.water_bags > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-pink-800 mb-4">Resources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {profile.food_bags > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="aspect-square rounded-lg overflow-hidden mb-2">
                    <img
                      src="/lovable-uploads/b24a8411-75e4-4300-a1d9-367c2510a6a1.png"
                      alt="Food Bag"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-pink-800">Food Bags</CardTitle>
                  <CardDescription>Used to feed your pets and restore their hunger.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="capitalize">
                        consumable
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                      {profile.food_bags}x
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.water_bags > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="aspect-square rounded-lg overflow-hidden mb-2">
                    <img
                      src="/lovable-uploads/ba828120-519a-4ebc-a63e-d0b2be0b5b8b.png"
                      alt="Water Bag"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-blue-800">Water Bags</CardTitle>
                  <CardDescription>Used to hydrate your pets and restore their water levels.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="capitalize">
                        consumable
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {profile.water_bags}x
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Shop Items */}
      {inventoryItems.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-pink-800 mb-4">Shop Items</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inventoryItems.map((inventoryItem) => (
              <Card key={inventoryItem.id} className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="aspect-square rounded-lg overflow-hidden mb-2">
                    <img
                      src={inventoryItem.shop_items?.image_url || "/placeholder.svg"}
                      alt={inventoryItem.shop_items?.name || "Item"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-pink-800">
                    {inventoryItem.shop_items?.name || "Unknown Item"}
                  </CardTitle>
                  <CardDescription>
                    {inventoryItem.shop_items?.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="capitalize">
                        {inventoryItem.shop_items?.item_type || "item"}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                      {inventoryItem.quantity}x
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                      {new Date(inventoryItem.acquired_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        !profile || (profile.food_bags === 0 && profile.water_bags === 0) ? (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Your inventory is empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Visit the shop to purchase items!
              </p>
            </CardContent>
          </Card>
        ) : null
      )}
    </div>
  );
};

export default InventoryTab;
