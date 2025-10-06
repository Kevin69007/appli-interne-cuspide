
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price_nd: number | null;
  price_np: number | null;
  image_url: string | null;
  item_type: string;
  is_available: boolean;
}

interface ShopItemCardProps {
  item: ShopItem;
  profile: any;
  onPurchase: (item: ShopItem) => void;
  getDisplayItem: (item: ShopItem) => ShopItem;
}

const ShopItemCard = ({ item, profile, onPurchase, getDisplayItem }: ShopItemCardProps) => {
  const displayItem = getDisplayItem(item);

  // Use the new food container image for pet food items
  const getImageUrl = () => {
    if (displayItem.name.toLowerCase().includes('pet food') || displayItem.name.toLowerCase().includes('food bag')) {
      return '/lovable-uploads/f98614c0-f3e7-465d-b18b-fc523eb60972.png';
    }
    return displayItem.image_url || "/placeholder.svg";
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="aspect-square rounded-lg overflow-hidden mb-2">
          <img
            src={getImageUrl()}
            alt={displayItem.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardTitle className="text-pink-800">{displayItem.name}</CardTitle>
        <CardDescription>{displayItem.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="capitalize">
              {displayItem.item_type}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {displayItem.price_nd && (
              <Badge className="bg-yellow-100 text-yellow-800">
                {displayItem.price_nd} PD
              </Badge>
            )}
            {displayItem.price_np && (
              <Badge className="bg-purple-100 text-purple-800">
                {displayItem.price_np} PP
              </Badge>
            )}
          </div>
        </div>
        
        <Button
          onClick={() => onPurchase(displayItem)}
          className="w-full bg-pink-600 hover:bg-pink-700"
          disabled={!profile || 
            (displayItem.price_nd && profile.paw_dollars < displayItem.price_nd) ||
            (displayItem.price_np && profile.paw_points < displayItem.price_np)
          }
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Purchase
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShopItemCard;
