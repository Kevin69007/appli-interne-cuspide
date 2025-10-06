
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ShelterPetPurchaseButtonProps {
  pet: any;
  onPurchase: () => void;
}

interface AdoptionResponse {
  success: boolean;
  error?: string;
  message?: string;
}

const ShelterPetPurchaseButton = ({ pet, onPurchase }: ShelterPetPurchaseButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to adopt this pet.",
        variant: "destructive",
      });
      return;
    }

    if (!pet.is_available) {
      toast({
        title: "Pet Not Available",
        description: "This pet is no longer available for adoption.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);

    try {
      // Call the Supabase function to adopt the shelter pet
      const { data, error } = await supabase.rpc('adopt_shelter_pet', {
        shelter_pet_id_param: pet.id,
        adopter_id_param: user.id,
        adoption_price_param: 70000  // 70,000 Paw Points
      });

      if (error) throw error;

      // Type cast the JSON response with proper null check
      const response = (data as unknown) as AdoptionResponse;

      if (response && response.success) {
        toast({
          title: "Congratulations!",
          description: `You have successfully adopted ${pet.pet_name}!`,
        });
        
        // Navigate to user's profile to see their new pet
        navigate('/profile');
        onPurchase();
      } else {
        throw new Error(response?.error || 'Adoption failed');
      }
    } catch (error) {
      console.error("Error adopting pet:", error);
      toast({
        title: "Adoption Failed",
        description: error instanceof Error ? error.message : "Failed to adopt pet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!pet.is_available) {
    return (
      <Button variant="outline" disabled className="w-full">
        <ShoppingCart className="w-4 h-4 mr-2" />
        No Longer Available
      </Button>
    );
  }

  return (
    <Button 
      onClick={handlePurchase}
      disabled={isPurchasing}
      className="bg-green-600 hover:bg-green-700"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {isPurchasing ? "Adopting..." : "Adopt for 70,000 PP"}
    </Button>
  );
};

export default ShelterPetPurchaseButton;
