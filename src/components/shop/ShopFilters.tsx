
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Coins, Package } from "lucide-react";

interface ShopFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  profile: any;
}

const ShopFilters = ({ categories, selectedCategory, onCategoryChange, profile }: ShopFiltersProps) => {
  console.log("ShopFilters render - Profile received:", {
    hasProfile: !!profile,
    paw_dollars: profile?.paw_dollars,
    paw_points: profile?.paw_points,
    full_profile: profile
  });

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-pink-600" />
            <span className="font-medium text-pink-800">Filter by Category:</span>
          </div>
          {profile && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">{profile.paw_dollars || 0} PD</span>
              </div>
              <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                <Package className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">{profile.paw_points || 0} PP</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => onCategoryChange(category)}
              className={selectedCategory === category ? "bg-pink-600 hover:bg-pink-700" : ""}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopFilters;
