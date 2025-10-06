
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";

interface PawClubBadgeProps {
  className?: string;
  iconOnly?: boolean;
}

const PawClubBadge = ({ className = "", iconOnly = false }: PawClubBadgeProps) => {
  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Crown className={`w-7 h-7 text-pink-500 ${className}`} fill="currentColor" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>PawClub</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge 
      className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-300 font-semibold ${className}`}
      variant="outline"
    >
      <Crown className="w-3 h-3 mr-1" />
      PawClub
    </Badge>
  );
};

export default PawClubBadge;
