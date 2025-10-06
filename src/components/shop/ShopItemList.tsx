
import ShopItemCard from "./ShopItemCard";
import ShopEmptyState from "./ShopEmptyState";

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

interface ShopItemListProps {
  items: ShopItem[];
  profile: any;
  onPurchase: (item: ShopItem) => void;
  getDisplayItem: (item: ShopItem) => ShopItem;
}

const ShopItemList = ({ items, profile, onPurchase, getDisplayItem }: ShopItemListProps) => {
  if (items.length === 0) {
    return <ShopEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ShopItemCard
          key={item.id}
          item={item}
          profile={profile}
          onPurchase={onPurchase}
          getDisplayItem={getDisplayItem}
        />
      ))}
    </div>
  );
};

export default ShopItemList;
