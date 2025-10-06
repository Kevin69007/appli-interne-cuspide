
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import IndividualPetCard from "@/components/pets/IndividualPetCard";
import PetPurchaseModal from "@/components/pets/PetPurchaseModal";
import { useBreedingStatus } from "@/hooks/useBreedingStatus";
import { usePetSales } from "@/hooks/usePetSales";
import { usePetActions } from "@/hooks/usePetActions";

interface PetsGridProps {
  userPets: any[];
  profile: any;
  userProfile: any;
  isOwnProfile: boolean;
  onUpdate: () => void;
  onStatsClick: (pet: any) => void;
  onProfileClick: (pet: any) => void;
}

const PetsGrid = ({
  userPets,
  profile,
  userProfile,
  isOwnProfile,
  onUpdate,
  onStatsClick,
  onProfileClick
}: PetsGridProps) => {
  const navigate = useNavigate();
  const { breedingPets } = useBreedingStatus();
  const { petSales } = usePetSales(profile?.id);
  const { feedPet, waterPet, isFeeding, isWatering } = usePetActions();
  
  const [purchaseModalPet, setPurchaseModalPet] = useState<any>(null);
  const [purchasePetSaleInfo, setPurchasePetSaleInfo] = useState<any>(null);
  // Optimistic bulk UI state for "Feed All" and "Water All" on other profiles
  const [bulkFeedSet, setBulkFeedSet] = useState<Set<string>>(new Set());
  const [bulkWaterSet, setBulkWaterSet] = useState<Set<string>>(new Set());

  // DISABLED: Listen for feed/water all events that cause immediate refreshes
  // These were causing pets to revert to 0% after feeding/watering
  // useEffect(() => {
  //   const handleFeedAll = () => {
  //     console.log('🍖 Received feed-all event, refreshing...');
  //     onUpdate();
  //   };
  //   const handleWaterAll = () => {
  //     console.log('💧 Received water-all event, refreshing...');
  //     onUpdate();
  //   };
  //   window.addEventListener('pets-fed-all', handleFeedAll);
  //   window.addEventListener('pets-watered-all', handleWaterAll);
  //   return () => {
  //     window.removeEventListener('pets-fed-all', handleFeedAll);
  //     window.removeEventListener('pets-watered-all', handleWaterAll);
  //   };
  // }, [onUpdate]);

  // DISABLED: Realtime subscription that was causing immediate reverts
  // The grace period in calculateCurrentStats now handles showing updated values
  // useEffect(() => {
  //   if (!profile?.id) return;
  //   console.log(`🔔 Setting up realtime subscription for user ${profile.id}`);
  //   const channel = supabase
  //     .channel('pets-updates')
  //     .on('postgres_changes', {...}, (payload) => {
  //       console.log('🔔 Realtime pet update received:', payload);
  //       onUpdate();
  //     })
  //     .subscribe();
  //   return () => supabase.removeChannel(channel);
  // }, [profile?.id, onUpdate]);

  // Optimistic bulk UI feedback for other users' Feed/Water All
  useEffect(() => {
    const onBulkFeedStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.targetUserId !== profile?.id) return;
      const ids = new Set(userPets.map((p: any) => p.id));
      setBulkFeedSet(ids);
      setTimeout(() => setBulkFeedSet(new Set()), 1000);
    };
    const onBulkWaterStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.targetUserId !== profile?.id) return;
      const ids = new Set(userPets.map((p: any) => p.id));
      setBulkWaterSet(ids);
      setTimeout(() => setBulkWaterSet(new Set()), 1000);
    };
    window.addEventListener('bulk-feed-ui-start', onBulkFeedStart as EventListener);
    window.addEventListener('bulk-water-ui-start', onBulkWaterStart as EventListener);
    return () => {
      window.removeEventListener('bulk-feed-ui-start', onBulkFeedStart as EventListener);
      window.removeEventListener('bulk-water-ui-start', onBulkWaterStart as EventListener);
    };
  }, [profile?.id]);

  const handleBreedingClick = (pet: any) => {
    navigate('/breeding?tab=active-pairs');
  };

  const handleProfileClick = (pet: any) => {
    // Navigate to internal pet profile page
    navigate(`/pet/${pet.pet_number || 1}`);
  };

  const handlePurchaseClick = (pet: any, petSaleInfo: any) => {
    setPurchaseModalPet(pet);
    setPurchasePetSaleInfo(petSaleInfo);
  };

  const handlePurchaseComplete = () => {
    onUpdate();
  };

  if (userPets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {isOwnProfile ? "No pets yet. Visit the shop to adopt your first pet!" : "This user doesn't have any pets yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-6">
        {userPets.map((pet) => {
          const isBreeding = breedingPets.has(pet.id);
          const petSaleInfo = petSales.get(pet.id);
          
          console.log(`🏠 PetsGrid: Rendering ${pet.pet_name} - hunger: ${pet.hunger}, water: ${pet.water}`);
          
          // Create unified actions for all pets
          const feedAction = async () => {
            try {
              console.log(`🏠 PetsGrid: Starting feed action for ${pet.pet_name}`);
              
              const result = await feedPet(pet.id);
              
              if (result.success) {
                console.log(`🏠 PetsGrid: Feed action completed for ${pet.pet_name}`);
                // Only refresh on own profile to avoid page reload on other users' profiles
                if (isOwnProfile) {
                  setTimeout(() => onUpdate(), 1100);
                }
              }
            } catch (error) {
              console.error(`🏠 PetsGrid: Feed action error for ${pet.pet_name}:`, error);
            }
          };
          
          const waterAction = async () => {
            try {
              console.log(`🏠 PetsGrid: Starting water action for ${pet.pet_name}`);
              
              const result = await waterPet(pet.id);
              
              if (result.success) {
                console.log(`🏠 PetsGrid: Water action completed for ${pet.pet_name}`);
                // Only refresh on own profile to avoid page reload on other users' profiles
                if (isOwnProfile) {
                  setTimeout(() => onUpdate(), 1100);
                }
              }
            } catch (error) {
              console.error(`🏠 PetsGrid: Water action error for ${pet.pet_name}:`, error);
            }
          };

          return (
            <IndividualPetCard
              key={pet.id}
              pet={pet}
              profile={profile}
              userProfile={userProfile}
              isBreeding={isBreeding}
              petSaleInfo={petSaleInfo}
              onFeed={feedAction}
              onWater={waterAction}
              onStatsClick={() => onStatsClick(pet)}
              onProfileClick={() => handleProfileClick(pet)}
              onBreedingClick={() => handleBreedingClick(pet)}
              onPurchaseClick={() => handlePurchaseClick(pet, petSaleInfo)}
              isOwnProfile={isOwnProfile}
              isFeedingInProgress={isFeeding(pet.id) || bulkFeedSet.has(pet.id)}
              isWateringInProgress={isWatering(pet.id) || bulkWaterSet.has(pet.id)}
            />
          );
        })}
      </div>

      {/* Purchase Modal */}
      {purchaseModalPet && purchasePetSaleInfo && (
        <PetPurchaseModal
          pet={purchaseModalPet}
          petSaleInfo={purchasePetSaleInfo}
          sellerProfile={profile}
          isOpen={!!purchaseModalPet}
          onClose={() => {
            setPurchaseModalPet(null);
            setPurchasePetSaleInfo(null);
          }}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </>
  );
};

export default PetsGrid;
