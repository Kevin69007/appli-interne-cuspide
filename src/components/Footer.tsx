
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {

  return (
    <footer className="bg-pink-50 border-t border-pink-200 mt-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Heart className="h-6 w-6 text-pink-600 mr-2" />
            <span className="text-xl font-bold text-pink-800">PawPets</span>
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link 
              to="/faq"
              className="hover:text-pink-600 transition-colors cursor-pointer underline"
            >
              FAQ
            </Link>
            <Link 
              to="/privacy"
              className="hover:text-pink-600 transition-colors cursor-pointer underline"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/support"
              className="hover:text-pink-600 transition-colors cursor-pointer underline"
            >
              Support
            </Link>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-pink-200 text-center text-xs text-muted-foreground">
          © 2024 PawPets. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
