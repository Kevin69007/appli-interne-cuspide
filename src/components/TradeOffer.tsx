
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";

interface TradeOfferProps {
  recipient: { id: string; username: string };
  onBack: () => void;
  onTradeCreated: () => void;
}

const TradeOffer = ({ recipient, onBack, onTradeCreated }: TradeOfferProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userPets, setUserPets] = useState<any[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAssets();
  }, []);

  const fetchUserAssets = async () => {
    if (!user) return;

    try {
      // Fetch user pets
      const { data: petsData, error: petsError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (name, type, image_url)
        `)
        .eq("user_id", user.id);

      if (petsError) throw petsError;

      // Fetch user inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("user_inventory_items")
        .select(`
          *,
          shop_items (name, image_url, item_type)
        `)
        .eq("user_id", user.id);

      if (inventoryError) throw inventoryError;

      setUserPets(petsData || []);
      setUserItems(inventoryData || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTrade = async () => {
    if (!user || (selectedPets.length === 0 && selectedItems.length === 0)) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to trade",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the trade
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .insert({
          initiator_id: user.id,
          recipient_id: recipient.id,
        })
        .select()
        .single();

      if (tradeError) throw tradeError;

      // Add selected pets to trade
      if (selectedPets.length > 0) {
        const { error: petsError } = await supabase
          .from("trade_pets")
          .insert(
            selectedPets.map(petId => ({
              trade_id: tradeData.id,
              user_pet_id: petId,
              owner_id: user.id,
            }))
          );

        if (petsError) throw petsError;
      }

      // Add selected items to trade
      if (selectedItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("trade_items")
          .insert(
            selectedItems.map(itemId => {
              const item = userItems.find(i => i.id === itemId);
              return {
                trade_id: tradeData.id,
                shop_item_id: item.shop_item_id,
                quantity: 1,
                owner_id: user.id,
              };
            })
          );

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Trade created!",
        description: `Trade offer sent to ${recipient.username}`,
      });

      onTradeCreated();
    } catch (error) {
      console.error("Error creating trade:", error);
      toast({
        title: "Error",
        description: "Failed to create trade",
        variant: "destructive",
      });
    }
  };

  const togglePetSelection = (petId: string) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold text-pink-800">
          Create Trade with {recipient.username}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Pets */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
          <CardHeader>
            <CardTitle className="text-pink-800">Your Pets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {userPets.map((pet) => (
              <div
                key={pet.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPets.includes(pet.id)
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
                onClick={() => togglePetSelection(pet.id)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={pet.pets.image_url || "/placeholder.svg"} 
                    alt={pet.pet_name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium">{pet.pet_name}</p>
                    <p className="text-sm text-muted-foreground">{pet.pets.name}</p>
                  </div>
                </div>
              </div>
            ))}
            {userPets.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No pets available</p>
            )}
          </CardContent>
        </Card>

        {/* Your Items */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
          <CardHeader>
            <CardTitle className="text-pink-800">Your Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {userItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedItems.includes(item.id)
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={item.shop_items.image_url || "/placeholder.svg"} 
                    alt={item.shop_items.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.shop_items.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {userItems.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No items available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-pink-800">Trade Summary</p>
              <p className="text-sm text-muted-foreground">
                {selectedPets.length} pets and {selectedItems.length} items selected
              </p>
            </div>
            <Button 
              onClick={createTrade}
              className="bg-pink-600 hover:bg-pink-700"
              disabled={selectedPets.length === 0 && selectedItems.length === 0}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Send Trade Offer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeOffer;
