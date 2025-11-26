import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
  photoUrl?: string | null;
  nom?: string;
  prenom?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

// Generate consistent color from name
const getColorFromName = (nom: string = "", prenom: string = "") => {
  const fullName = `${prenom} ${nom}`;
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
};

export const EmployeeAvatar = React.forwardRef<
  HTMLDivElement,
  EmployeeAvatarProps
>(({ photoUrl, nom = "", prenom = "", size = "md", className, showTooltip = true }, ref) => {
  const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  const fullName = `${prenom} ${nom}`;
  const bgColor = getColorFromName(nom, prenom);

  const avatarContent = (
    <Avatar ref={ref} className={cn(sizeClasses[size], className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={fullName} />}
      <AvatarFallback 
        style={{ backgroundColor: bgColor }}
        className="text-white font-semibold"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  if (!showTooltip || (!nom && !prenom)) {
    return avatarContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatarContent}
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

EmployeeAvatar.displayName = "EmployeeAvatar";
