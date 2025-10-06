
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { 
  User, 
  Heart, 
  MessageSquare, 
  ShoppingBag, 
  Building, 
  LogOut, 
  Baby,
  Menu,
  CreditCard
} from "lucide-react";
import MessageNotificationIcon from "@/components/MessageNotificationIcon";
import FriendRequestNotificationIcon from "@/components/FriendRequestNotificationIcon";

interface MobileNavigationProps {
  onSignOut: () => void;
}

const MobileNavigation = ({ onSignOut }: MobileNavigationProps) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/forums") {
      // Highlight forums button for any forum route
      return location.pathname === "/forums" || location.pathname.startsWith("/forums/");
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: "/profile", label: "Profile", icon: User },
    { path: "/play", label: "Adopt", icon: Heart },
    { path: "/breeding", label: "Breeding", icon: Baby },
    { path: "/shelter", label: "Shelter", icon: Building },
    { path: "/forums", label: "Forums", icon: MessageSquare },
    { path: "/shop", label: "Shop", icon: ShoppingBag },
    { path: "/bank", label: "Bank", icon: CreditCard },
  ];

  const handleClose = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    onSignOut();
    handleClose();
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="flex items-center gap-2">
          <MessageNotificationIcon />
          <FriendRequestNotificationIcon />
          <Button variant="ghost" size="sm" className="md:hidden rounded-full">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-pink-800">Navigation</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <DrawerClose key={item.path} asChild>
                  <Link to={item.path} className="block" onClick={handleClose}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start rounded-full ${
                        isActive(item.path) 
                          ? "bg-pink-600 hover:bg-pink-700" 
                          : "text-pink-700 hover:text-pink-800 hover:bg-pink-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                </DrawerClose>
              );
            })}
            
            <DrawerClose asChild>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full justify-start rounded-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileNavigation;
