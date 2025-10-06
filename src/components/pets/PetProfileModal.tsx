
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PetProfileHeader from "@/components/pet-profile/PetProfileHeader";
import PetStatsCard from "@/components/pet-profile/PetStatsCard";
import { useAuth } from "@/contexts/AuthContext";
import { calculateAge } from "@/utils/timeHelpers";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PetProfileModalProps {
  pet: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  isOwnProfile?: boolean;
}

const PetProfileModal = ({ pet, isOpen, onClose, onUpdate, isOwnProfile = false }: PetProfileModalProps) => {
  const { user } = useAuth();
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [currentPet, setCurrentPet] = useState(pet);
  const [petSaleInfo, setPetSaleInfo] = useState<any>(null);

  // Check if this is actually the user's own pet
  const actualIsOwnProfile = user?.id === currentPet?.user_id;

  useEffect(() => {
    setCurrentPet(pet);
  }, [pet]);

  useEffect(() => {
    if (isOpen && currentPet?.user_id) {
      fetchOwnerProfile();
      fetchPetSaleInfo();
    }
  }, [isOpen, currentPet?.user_id, currentPet?.id]);

  const fetchOwnerProfile = async () => {
    if (!currentPet?.user_id) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", currentPet.user_id)
      .single();

    if (error) {
      console.error("Error fetching owner profile:", error);
      setOwnerProfile({ username: "Unknown User" });
    } else {
      setOwnerProfile(data);
    }
  };

  const fetchPetSaleInfo = async () => {
    if (!currentPet?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("pet_sales")
        .select("*")
        .eq("user_pet_id", currentPet.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPetSaleInfo(data);
    } catch (error) {
      console.error("Error fetching pet sale info:", error);
      setPetSaleInfo(null);
    }
  };

  const handlePetUpdate = async () => {
    console.log('🔄 PetProfileModal: Handling pet update...');
    
    // Refresh the current pet data and sale info
    if (currentPet?.id) {
      try {
        const { data: updatedPet, error } = await supabase
          .from("user_pets")
          .select(`
            *,
            pets!inner(*)
          `)
          .eq("id", currentPet.id)
          .single();

        if (error) {
          console.error("Error refreshing pet data:", error);
          
          // If pet not found (404 error), it was likely sold to shelter
          if (error.code === 'PGRST116' && actualIsOwnProfile) {
            console.log('🏠 Pet no longer exists - likely sold to shelter, closing modal...');
            onClose();
            return;
          }
        } else if (updatedPet) {
          console.log('✅ Pet data refreshed:', updatedPet);
          setCurrentPet(updatedPet);
          
          // Check if ownership changed (pet was purchased)
          if (updatedPet.user_id !== currentPet.user_id) {
            console.log('🔄 Pet ownership changed, closing modal...');
            setPetSaleInfo(null); // Clear sale info immediately
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        }
        
        // Always refresh sale info after update
        await fetchPetSaleInfo();
        
      } catch (error) {
        console.error("Error refreshing pet data:", error);
      }
    }

    // Call parent update callback
    if (onUpdate) {
      onUpdate();
    }
  };

  if (!currentPet) return null;

  console.log('🪟 PetProfileModal rendering for pet:', currentPet.pet_name, 'breed:', currentPet.breed, 'actualIsOwnProfile:', actualIsOwnProfile, 'saleInfo:', petSaleInfo);

  // Create mock parents data structure (forum embeds don't have parent info)
  const parents = { mother: null, father: null };

  // Calculate age for description
  const ageInDays = currentPet.birthday ? calculateAge(currentPet.birthday) : 0;
  const months = Math.floor(ageInDays / 30);
  const days = ageInDays % 30;

  // Format dates for description
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'numeric',
      day: 'numeric', 
      year: 'numeric'
    });
  };

  // Get owner's username from the fetched profile
  const ownerUsername = ownerProfile?.username || "Unknown User";

  // Create enhanced pet object with ALWAYS auto-generated description for modal
  const enhancedPet = {
    ...currentPet,
    description: `${currentPet.pet_name} is a ${currentPet.gender} ${currentPet.breed} and was born ${currentPet.birthday ? formatDate(currentPet.birthday) : 'on an unknown date'}${currentPet.adopted_at ? ` and was last adopted by ${ownerUsername} on ${formatDate(currentPet.adopted_at)}` : ''}. ${currentPet.pet_name} is ${months} month${months !== 1 ? 's' : ''}, ${days} day${days !== 1 ? 's' : ''} old.`
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentPet.pet_name}'s Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PetProfileHeader 
            pet={enhancedPet} 
            parents={parents} 
            isOwnProfile={actualIsOwnProfile}
            onUpdate={handlePetUpdate}
            isForumModal={false}
          />
          <PetStatsCard 
            pet={currentPet}
            onUpdate={handlePetUpdate}
            petSaleInfo={petSaleInfo}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PetProfileModal;
