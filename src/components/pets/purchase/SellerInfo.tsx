
import { User } from "lucide-react";

interface SellerInfoProps {
  sellerProfile: any;
}

const SellerInfo = ({ sellerProfile }: SellerInfoProps) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
      <User className="w-4 h-4 text-blue-600" />
      <span className="text-sm">
        Seller: <strong>{sellerProfile?.username || "Unknown"}</strong>
      </span>
    </div>
  );
};

export default SellerInfo;
