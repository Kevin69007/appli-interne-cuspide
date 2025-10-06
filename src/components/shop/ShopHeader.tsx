
import { Card, CardContent } from "@/components/ui/card";

interface ShopHeaderProps {
  profile: any;
}

const ShopHeader = ({ profile }: ShopHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-pink-800 mb-4">PawShop</h1>
          <p className="text-xl text-muted-foreground">Purchase items with Paw Dollars and Paw Points</p>
        </div>
      </div>
    </div>
  );
};

export default ShopHeader;
