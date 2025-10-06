
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PetProfileHeader from "./PetProfileHeader";
import PetStatsCard from "./PetStatsCard";
import Navigation from "@/components/Navigation";
import { isPromotionActive } from "@/utils/discountUtils";

interface PetProfileLayoutProps {
  pet: any;
  parents: { mother: any; father: any };
  isOwnProfile: boolean;
  onUpdate: () => void;
}

const PetProfileLayout = ({ pet, parents, isOwnProfile, onUpdate }: PetProfileLayoutProps) => {
  const showPromoBanner = isPromotionActive();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      
      <div className={showPromoBanner ? "page-with-nav-and-banner" : "page-with-nav"}>
        <div className="container mx-auto px-4 py-8">
          <Button asChild className="mb-6">
            <Link to="/profile">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PetProfileHeader 
              pet={pet} 
              parents={parents} 
              isOwnProfile={isOwnProfile}
              onUpdate={onUpdate}
            />
            <div className="space-y-6">
              <PetStatsCard 
                pet={pet} 
                onUpdate={onUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetProfileLayout;
