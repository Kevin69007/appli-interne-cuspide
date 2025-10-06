
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      <Navigation />
      <div className="pt-28 flex items-center justify-center min-h-[calc(100vh-7rem)]">
        <div className="text-center p-8 max-w-md">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-pink-600 mb-4">404</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/">Go to Home</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/profile">My Profile</Link>
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>If you think this is a mistake, please contact support.</p>
            <p className="mt-1">Path: <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
