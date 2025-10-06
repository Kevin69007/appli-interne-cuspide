
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, Package, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { recordTransaction } from "@/utils/transactionUtils";
import SimplePurchaseModal from "@/components/shared/SimplePurchaseModal";

interface ShelterPetActionsProps {
  pet: any;
  onAdopt: () => void;
}

const ShelterPetActions = ({ pet, onAdopt }: ShelterPetActionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdopting, setIsAdopting] = useState(false);
  const [showPDModal, setShowPDModal] = useState(false);
  const [showPPModal, setShowPPModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("paw_dollars, paw_points")
      .eq("id", user.id)
      .single();
    
    setUserProfile(profile);
  };

  const handlePDClick = () => {
    fetchUserProfile();
    setShowPDModal(true);
  };

  const handlePPClick = () => {
    fetchUserProfile();
    setShowPPModal(true);
  };

  const handleAdopt = async (usePawPoints = false) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to adopt a pet",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsAdopting(true);

    try {
      const { data: currentPet, error: petCheckError } = await supabase
        .from("shelter_pets")
        .select("*")
        .eq("id", pet.id)
        .eq("is_available", true)
        .single();

      if (petCheckError || !currentPet) {
        toast({
          title: "Pet no longer available",
          description: "This pet has already been adopted or is no longer available.",
          variant: "destructive",
        });
        onAdopt();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_dollars, paw_points")
        .eq("id", user.id)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to load your profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const cost = usePawPoints ? 70000 : 70;
      const currency = usePawPoints ? "Paw Points" : "Paw Dollars";
      const userAmount = usePawPoints ? profile.paw_points : profile.paw_dollars;

      if (userAmount < cost) {
        toast({
          title: "Insufficient funds",
          description: `You need ${cost} ${currency} to adopt this pet`,
          variant: "destructive",
        });
        return;
      }

      if (!pet.original_pet_id) {
        toast({
          title: "Error",
          description: "Pet data is corrupted. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      const newUserPetData = {
        user_id: user.id,
        pet_id: pet.original_pet_id,
        pet_name: pet.pet_name,
        breed: pet.breed,
        gender: pet.gender,
        friendliness: pet.friendliness,
        playfulness: pet.playfulness,
        energy: pet.energy,
        loyalty: pet.loyalty,
        curiosity: pet.curiosity,
        adopted_at: new Date().toISOString(),
        hunger: 100,
        water: 100,
        last_fed: new Date().toISOString(),
        last_watered: new Date().toISOString(),
        display_order: 0,
        ...(pet.pet_number ? { pet_number: pet.pet_number } : {}),
        ...(pet.birthday ? { birthday: pet.birthday } : {})
      };

      const { data: newUserPet, error: createPetError } = await supabase
        .from("user_pets")
        .insert(newUserPetData)
        .select()
        .single();

      if (createPetError) {
        toast({
          title: "Error",
          description: "Failed to create your new pet. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const { error: shelterDeleteError } = await supabase
        .from("shelter_pets")
        .delete()
        .eq("id", pet.id);

      const updateData = usePawPoints 
        ? { paw_points: profile.paw_points - cost }
        : { paw_dollars: profile.paw_dollars - cost };
        
      await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      try {
        if (usePawPoints) {
          await recordTransaction({
            userId: user.id,
            pawPoints: -cost,
            description: `Adopted ${pet.pet_name} from shelter`,
            transactionType: 'shelter_adoption'
          });
        } else {
          await recordTransaction({
            userId: user.id,
            pawDollars: -cost,
            description: `Adopted ${pet.pet_name} from shelter`,
            transactionType: 'shelter_adoption'
          });
        }
      } catch (transactionError) {
        console.error("Error recording transaction:", transactionError);
      }

      toast({
        title: "Adoption successful!",
        description: `You have adopted ${pet.pet_name} for ${cost} ${currency}! Pet #${newUserPet.pet_number} is now yours.`,
      });

      onAdopt();

    } catch (error) {
      console.error("Error during adoption:", error);
      toast({
        title: "Adoption failed",
        description: "Something went wrong during the adoption process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdopting(false);
      setShowPDModal(false);
      setShowPPModal(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {user ? (
          <>
            <Button
              onClick={handlePDClick}
              disabled={isAdopting}
              className="w-full bg-pink-600 hover:bg-pink-700 text-sm"
            >
              <Coins className="w-4 h-4 mr-2" />
              {isAdopting ? "Adopting..." : `Adopt for 70 PD`}
            </Button>
            
            <Button
              onClick={handlePPClick}
              disabled={isAdopting}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-sm"
            >
              <Package className="w-4 h-4 mr-2" />
              {isAdopting ? "Adopting..." : "Adopt for 70,000 PP"}
            </Button>
          </>
        ) : (
          <Button
            onClick={() => navigate("/auth")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in to Adopt
          </Button>
        )}
      </div>

      <SimplePurchaseModal
        isOpen={showPDModal}
        onClose={() => setShowPDModal(false)}
        onConfirm={() => handleAdopt(false)}
        petName={pet.pet_name}
        cost={70}
        userBalance={userProfile?.paw_dollars || 0}
        isProcessing={isAdopting}
      />

      <SimplePurchaseModal
        isOpen={showPPModal}
        onClose={() => setShowPPModal(false)}
        onConfirm={() => handleAdopt(true)}
        petName={pet.pet_name}
        cost={70000}
        userBalance={userProfile?.paw_points || 0}
        isProcessing={isAdopting}
        currencyType="Paw Points"
      />
    </>
  );
};

export default ShelterPetActions;
