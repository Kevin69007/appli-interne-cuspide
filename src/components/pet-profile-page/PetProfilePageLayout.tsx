
import { useState } from "react";
import Navigation from "@/components/Navigation";
import PetProfileHeader from "./PetProfileHeader";
import PetStatsSection from "./PetStatsSection";
import PetActionButtons from "./PetActionButtons";
import PetHungerWaterBars from "./PetHungerWaterBars";
import PetTabNavigation from "./PetTabNavigation";
import PetAboutSection from "./PetAboutSection";
import PetOwnerSection from "./PetOwnerSection";
import PetCareHistory from "./PetCareHistory";
import PetSaleTab from "./PetSaleTab";
import PetOrderSetting from "@/components/pet-profile/PetOrderSetting";
import { isPromotionActive } from "@/utils/discountUtils";
import { useAuth } from "@/contexts/AuthContext";
import { usePetActions } from "@/hooks/usePetActions";

interface PetProfilePageLayoutProps {
  pet: any;
  owner: any;
  isShelterPet?: boolean;
  onUpdate: () => void;
}

const PetProfilePageLayout = ({ pet, owner, isShelterPet = false, onUpdate }: PetProfilePageLayoutProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const showPromoBanner = isPromotionActive();
  const isOwnPet = user?.id === pet?.user_id && !isShelterPet;

  // Get pet actions from the unified hook
  const { feedPet, waterPet, isFeeding, isWatering } = usePetActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      {/* Fixed background pattern */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          backgroundRepeat: 'repeat',
          backgroundPosition: '0 0'
        }} 
      />

      <Navigation />
      
      <div className={showPromoBanner ? "page-with-nav-and-banner" : "page-with-nav"}>
        <div className="container mx-auto px-12 py-8 relative z-10">
          {/* Pet Header */}
          <PetProfileHeader 
            pet={pet} 
            owner={owner} 
            isOwnPet={isOwnPet} 
            isShelterPet={isShelterPet}
            onUpdate={onUpdate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
            {/* Left Column - Action buttons, hunger/water bars, and owner section */}
            <div className="lg:col-span-1 space-y-4">
              {/* Action Buttons - only show for owned pets */}
              {!isShelterPet && (
                <div className="px-4">
                  <PetActionButtons 
                    pet={pet} 
                    isOwnPet={isOwnPet} 
                    onUpdate={onUpdate}
                    feedPet={feedPet}
                    waterPet={waterPet}
                    isFeeding={isFeeding(pet.id)}
                    isWatering={isWatering(pet.id)}
                  />
                </div>
              )}

              {/* Hunger/Water Bars - only show for owned pets */}
              {!isShelterPet && (
                <div className="px-4">
                  <PetHungerWaterBars 
                    pet={pet}
                    isFeeding={isFeeding(pet.id)}
                    isWatering={isWatering(pet.id)}
                  />
                </div>
              )}

              {/* Owner Section */}
              <div className="px-4">
                <PetOwnerSection owner={owner} />
              </div>
            </div>

            {/* Right Column - Extended to take remaining space */}
            <div className="lg:col-span-4 space-y-6">
              {/* Extended Tab Navigation */}
              <PetTabNavigation 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                isShelterPet={isShelterPet}
              />
              
              {/* Tab Content */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  {/* Stats section - centered under tabs */}
                  <div className="flex justify-center">
                    <div className="w-full max-w-md">
                      <PetStatsSection pet={pet} />
                    </div>
                  </div>
                  
                  {/* About Section below stats, extends to the left to align with owner section */}
                  <div className="lg:-ml-[calc(22%+1.5rem)] min-h-[380px] w-full lg:w-[125%] space-y-6">
                    <PetAboutSection 
                      pet={pet} 
                      isOwnPet={isOwnPet} 
                      onUpdate={onUpdate} 
                    />
                    
                    {/* Pet Order Setting - only show for owned pets */}
                    {isOwnPet && (
                      <PetOrderSetting 
                        pet={pet} 
                        onUpdate={onUpdate} 
                      />
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === "care-history" && (
                <div className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Care History</h3>
                  <PetCareHistory petId={pet.id} />
                </div>
              )}
              {activeTab === "breeding" && (
                <div className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Breeding</h3>
                  <p className="text-muted-foreground">
                    {isShelterPet 
                      ? "Shelter pets cannot be used for breeding until they are adopted."
                      : "Breeding functionality coming soon..."
                    }
                  </p>
                </div>
              )}
              {activeTab === "sale" && (
                <PetSaleTab 
                  pet={pet}
                  isOwnProfile={isOwnPet}
                  onUpdate={onUpdate}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetProfilePageLayout;
