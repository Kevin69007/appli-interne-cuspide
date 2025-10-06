
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PawPrint } from "lucide-react";
import { getXPLevel } from "@/utils/xpLevels";

interface XPLevelBadgeProps {
  xp: number;
  className?: string;
}

const XPLevelBadge = ({ xp, className = "" }: XPLevelBadgeProps) => {
  const level = getXPLevel(xp);
  
  // Enhanced styling for higher tiers
  const getEnhancedStyle = () => {
    if (level.name === "PawGuru") {
      return "bg-black text-white";
    }
    return level.color;
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${getEnhancedStyle()} ${className}`}>
            <PawPrint className="w-5 h-5 -rotate-45" fill="currentColor" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{level.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPLevelBadge;
