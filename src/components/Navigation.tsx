
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { NavigationAuth } from "./navigation/NavigationAuth";
import { NavigationGuest } from "./navigation/NavigationGuest";
import { isPromotionActive, formatPromotionEndDate } from "@/utils/discountUtils";
import { useBannerDismissal } from "@/hooks/useBannerDismissal";
import { X } from "lucide-react";

const Navigation = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { bannerDismissed, dismissBanner } = useBannerDismissal();

  console.log("Navigation - Auth state:", { 
    hasUser: !!user, 
    userId: user?.id, 
    loading, 
    currentPath: location.pathname 
  });

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent double-clicks
    
    try {
      console.log("Navigation handleSignOut - Starting sign out");
      setIsSigningOut(true);
      
      await signOut();
      
      toast({
        title: "Signed out successfully",
        description: "Come back soon!",
      });
      
      // Navigate to home page immediately after sign out
      console.log("Navigation handleSignOut - Redirecting to home");
      navigate("/", { replace: true });
      
    } catch (error: any) {
      console.error("Navigation handleSignOut - Error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const isActive = (path: string) => {
    if (path === "/forums") {
      // Highlight forums button for any forum route
      return location.pathname === "/forums" || location.pathname.startsWith("/forums/");
    }
    return location.pathname === path;
  };

  const showPromoBanner = isPromotionActive() && !bannerDismissed;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out">
      {/* Promotional Banner - Only render when visible */}
      {showPromoBanner && (
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white relative animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto px-8 py-3">
            <div className="flex items-center justify-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">🎉 LIMITED TIME: 20% OFF ALL PAW DOLLAR PACKAGES!</span>
                <span className="bg-white/20 px-2 py-1 rounded text-sm font-medium">
                  Ends {formatPromotionEndDate()}
                </span>
                <Link to="/bank" className="bg-white text-pink-600 px-3 py-1 rounded font-medium hover:bg-pink-50 transition-colors">
                  Shop Now
                </Link>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/24e21340-1848-4308-86e5-8b2290b9d4e8.png" 
                alt="PawPets" 
                className="h-16 w-auto"
              />
            </Link>

            {/* Always show desktop navigation - no mobile detection */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : user ? (
                <NavigationAuth 
                  isActive={isActive}
                  onSignOut={handleSignOut}
                  isSigningOut={isSigningOut}
                />
              ) : (
                <NavigationGuest />
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
