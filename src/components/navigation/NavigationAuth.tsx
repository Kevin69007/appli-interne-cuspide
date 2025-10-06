
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, LogOut, Building, MessageSquare, Baby, ShoppingBag, CreditCard, Heart } from "lucide-react";
import MessageNotificationIcon from "@/components/MessageNotificationIcon";
import FriendRequestNotificationIcon from "@/components/FriendRequestNotificationIcon";

interface NavigationAuthProps {
  isActive: (path: string) => boolean;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export const NavigationAuth = ({ isActive, onSignOut, isSigningOut }: NavigationAuthProps) => {
  return (
    <>
      <Link to="/profile">
        <Button 
          variant={isActive("/profile") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <User className="w-5 h-5" />
        </Button>
      </Link>
      <Link to="/play">
        <Button 
          variant={isActive("/play") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </Link>
      <Link to="/breeding">
        <Button 
          variant={isActive("/breeding") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <Baby className="w-5 h-5" />
        </Button>
      </Link>
      <Link to="/shelter">
        <Button 
          variant={isActive("/shelter") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <Building className="w-5 h-5" />
        </Button>
      </Link>
      <Link to="/forums">
        <Button 
          variant={isActive("/forums") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </Link>
      <Link to="/shop">
        <Button 
          variant={isActive("/shop") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <ShoppingBag className="w-5 h-5" />
        </Button>
      </Link>
      <Link to="/bank">
        <Button 
          variant={isActive("/bank") ? "default" : "ghost"} 
          size="icon" 
          className="rounded-full w-10 h-10"
        >
          <CreditCard className="w-5 h-5" />
        </Button>
      </Link>
      <div className="flex items-center gap-3">
        <MessageNotificationIcon />
        <FriendRequestNotificationIcon />
      </div>
      <Button 
        onClick={onSignOut} 
        variant="outline" 
        size="sm" 
        className="rounded-full"
        disabled={isSigningOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        {isSigningOut ? "Signing Out..." : "Sign Out"}
      </Button>
    </>
  );
};
