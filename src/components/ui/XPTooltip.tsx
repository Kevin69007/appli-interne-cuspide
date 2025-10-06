
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getXPLevel, getXPProgress, XP_LEVELS } from "@/utils/xpLevels";

interface XPTooltipProps {
  xp: number;
  children: React.ReactNode;
}

const XPTooltip = ({ xp, children }: XPTooltipProps) => {
  const currentLevel = getXPLevel(xp);
  const progress = getXPProgress(xp);
  
  // Find the current level index and next level
  const currentLevelIndex = XP_LEVELS.findIndex(level => level.name === currentLevel.name);
  const nextLevel = currentLevelIndex < XP_LEVELS.length - 1 ? XP_LEVELS[currentLevelIndex + 1] : null;
  
  const xpNeeded = nextLevel ? nextLevel.minXP - xp : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>Current XP: {xp.toLocaleString()}</p>
            <p>Current Level: {currentLevel.name}</p>
            {nextLevel && xpNeeded > 0 && (
              <>
                <p>Next Level: {nextLevel.name}</p>
                <p>XP Needed: {xpNeeded.toLocaleString()}</p>
              </>
            )}
            {!nextLevel && (
              <p>Max level reached!</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPTooltip;
