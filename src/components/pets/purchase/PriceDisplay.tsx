
import { DollarSign } from "lucide-react";

interface PriceDisplayProps {
  price: number;
}

const PriceDisplay = ({ price }: PriceDisplayProps) => {
  return (
    <div className="text-center p-4 bg-green-50 rounded-lg">
      <div className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2">
        <DollarSign className="w-6 h-6" />
        {price} Paw Dollars
      </div>
    </div>
  );
};

export default PriceDisplay;
