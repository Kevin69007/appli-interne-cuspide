
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

const ShopEmptyState = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardContent className="text-center py-8">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">No items available in this category</p>
        <p className="text-sm text-muted-foreground">Check back later for new items!</p>
      </CardContent>
    </Card>
  );
};

export default ShopEmptyState;
