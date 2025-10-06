
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import Navigation from "@/components/Navigation";

interface UserProfileErrorProps {
  error: string;
  username: string | undefined;
  onRetry: () => void;
}

const UserProfileError = ({ error, username, onRetry }: UserProfileErrorProps) => {
  const navigate = useNavigate();

  const isNotFoundError = error.includes("not found") || error.includes("User");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      <main className="pt-24 px-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            {isNotFoundError ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
                <p className="text-muted-foreground mb-6">
                  The user "{username}" doesn't exist or the profile is not available.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-3xl font-bold mb-4">Something Went Wrong</h1>
                <p className="text-muted-foreground mb-6">
                  {error}
                </p>
              </>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onRetry} variant="default" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button onClick={() => navigate("/")} variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfileError;
