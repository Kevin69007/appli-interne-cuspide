
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SimpleAvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SimpleAvatar = ({ 
  src, 
  alt, 
  fallback, 
  size = "md", 
  className = "" 
}: SimpleAvatarProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  };

  const fallbackText = fallback || alt.charAt(0).toUpperCase();

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={src || undefined} alt={alt} />
      <AvatarFallback className="bg-pink-100 text-pink-600 text-sm">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
};

export default SimpleAvatar;
