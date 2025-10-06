
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

interface CareBadgeProps {
  careBadgeDays: number;
  className?: string;
}

const CareBadge = ({ careBadgeDays, className = "" }: CareBadgeProps) => {
  if (careBadgeDays <= 0) return null;

  return (
    <Badge 
      className={`bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300 font-semibold ${className}`}
      variant="outline"
    >
      <Heart className="w-3 h-3 mr-1" />
      {careBadgeDays} day{careBadgeDays !== 1 ? 's' : ''}
    </Badge>
  );
};

export default CareBadge;
