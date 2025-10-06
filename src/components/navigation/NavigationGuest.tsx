
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const NavigationGuest = () => {
  return (
    <>
      <Link to="/auth" className="text-pink-700 hover:text-pink-900 transition-colors">
        Sign In
      </Link>
      <Link to="/">
        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 rounded-full">
          Select Pet to Sign Up
        </Button>
      </Link>
    </>
  );
};
