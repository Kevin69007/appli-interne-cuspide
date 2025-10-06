
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  MessageCircle,
  Users,
  Baby,
  ShoppingCart,
  Gamepad2,
  Search,
  Shield,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile } = useProfile();
  const { hasUnreadMessages, unreadCount } = useMessageNotifications();

  const navigationItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/profile", icon: User, label: "Profile" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/nursery", icon: Baby, label: "Nursery" },
    { to: "/shelter", icon: Users, label: "Shelter" },
    { to: "/marketplace", icon: ShoppingCart, label: "Marketplace" },
    { to: "/games", icon: Gamepad2, label: "Games" },
    { to: "/forums", icon: MessageSquare, label: "Forums" },
    { to: "/bank", icon: CreditCard, label: "Bank" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Check if user has admin role for admin panel access
  const isAdmin = profile?.role === 'admin' || false;

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-primary">
              PetPond
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                    isActive(item.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              
              {/* Admin Panel Link - Only show for admins */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                    isActive("/admin")
                      ? "bg-destructive text-destructive-foreground"
                      : "text-destructive hover:text-destructive hover:bg-destructive/10"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6 space-x-4">
                {/* Messages Button */}
                <Link to="/messages">
                  <Button variant="ghost" size="sm" className="relative">
                    <MessageCircle className="h-5 w-5" />
                    {hasUnreadMessages && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.profile_image_url} />
                        <AvatarFallback>
                          {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{profile?.username || 'User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile?.paw_dollars || 0} PD • {profile?.paw_points || 0} PP
                        </p>
                      </div>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navigationItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2",
                    isActive(item.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}

              {/* Admin Panel Link - Mobile */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2",
                    isActive("/admin")
                      ? "bg-destructive text-destructive-foreground"
                      : "text-destructive hover:text-destructive hover:bg-destructive/10"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  Admin Panel
                </Link>
              )}
              
              {user && (
                <>
                  <div className="border-t border-border mt-3 pt-3">
                    <div className="flex items-center px-3 pb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.profile_image_url} />
                        <AvatarFallback>
                          {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="text-base font-medium">
                          {profile?.username || 'User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {profile?.paw_dollars || 0} PD • {profile?.paw_points || 0} PP
                        </div>
                      </div>
                      {hasUnreadMessages && (
                        <Badge variant="destructive" className="ml-auto">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                    <Link
                      to="/messages"
                      className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Messages
                      {hasUnreadMessages && (
                        <Badge variant="destructive" className="ml-auto">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <LogOut className="h-5 w-5" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
