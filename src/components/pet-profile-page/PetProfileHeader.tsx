import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import ShelterPetPurchaseButton from "./ShelterPetPurchaseButton";
import PetProfileEditor from "@/components/pet-profile/PetProfileEditor";
import { calculateAge } from "@/utils/timeHelpers";
import { useAuth } from "@/contexts/AuthContext";
import { usePetTransfer } from "@/hooks/usePetTransfer";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface PetProfileHeaderProps {
  pet: any;
  owner: any;
  isOwnPet?: boolean;
  isShelterPet?: boolean;
  onUpdate?: () => void;
}

const PetProfileHeader = ({ pet, owner, isOwnPet = false, isShelterPet = false, onUpdate }: PetProfileHeaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transferPetOwnership, isTransferring } = usePetTransfer();
  const [petSale, setPetSale] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getAgeString = (birthday: string) => {
    if (!birthday) return "Age unknown";
    
    const ageInDays = calculateAge(birthday);
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    const days = ageInDays % 30;
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : '0 days';
  };

  // Check if this pet is for sale and user can purchase it
  const canPurchase = !isOwnPet && 
                     !isShelterPet &&
                     petSale && 
                     petSale.is_active && 
                     petSale.seller_id === pet?.user_id &&
                     user?.id && 
                     user.id !== petSale.seller_id;

  useEffect(() => {
    if (!isShelterPet && pet?.id) {
      fetchPetSale();
    }
    if (user) {
      fetchUserProfile();
    }
  }, [pet?.id, user, isShelterPet]);

  const fetchPetSale = async () => {
    try {
      const { data, error } = await supabase
        .from("pet_sales")
        .select(`
          *,
          user_pets!inner(user_id)
        `)
        .eq("user_pet_id", pet.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const actualPetOwner = data.user_pets.user_id;
        if (actualPetOwner === data.seller_id) {
          setPetSale(data);
        } else {
          setPetSale(null);
        }
      } else {
        setPetSale(null);
      }
    } catch (error) {
      console.error("Error fetching pet sale:", error);
      setPetSale(null);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handlePurchase = async () => {
    if (!user || !petSale || !userProfile || !canPurchase) return;

    if (userProfile.paw_dollars < petSale.price_nd) {
      toast({
        title: "Insufficient funds",
        description: `You need ${petSale.price_nd} PD but only have ${userProfile.paw_dollars} PD`,
        variant: "destructive",
      });
      return;
    }

    const result = await transferPetOwnership(
      pet.id,
      petSale.seller_id,
      petSale.price_nd
    );

    if (result.success) {
      setPetSale(null);
      setUserProfile(prev => ({ 
        ...prev, 
        paw_dollars: prev.paw_dollars - petSale.price_nd 
      }));
      
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Pet Image */}
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-red-500 flex-shrink-0">
            <PetImageDisplay
              pet={pet}
              alt={pet.pet_name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Pet Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {isOwnPet && !isShelterPet ? (
                <PetProfileEditor pet={pet} onUpdate={onUpdate || (() => {})} />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-pink-800">{pet.pet_name}</h1>
                  <Badge variant="outline" className="text-xs">
                    #{pet.pet_number || 1}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="text-lg text-muted-foreground">
              <p>
                <span className="font-medium">{pet.pet_name}</span> is a{" "}
                <span className="font-medium">{pet.gender}</span>{" "}
                <span className="font-medium">{pet.breed || pet.pets?.name}</span> born on{" "}
                <span className="font-medium">{formatDate(pet.birthday)}</span>
                {isShelterPet ? (
                  <>
                    {" "}and is currently available for adoption from the shelter
                  </>
                ) : (
                  <>
                    {" "}and last adopted by{" "}
                    <span className="font-medium">{owner?.username || "Unknown User"}</span> on{" "}
                    <span className="font-medium">{formatDate(pet.adopted_at)}</span>
                  </>
                )}
              </p>
            </div>
            
            {/* Age Display */}
            <div className="mt-4">
              <p className="text-lg text-muted-foreground">
                <span className="font-medium">{pet.pet_name}</span> is{" "}
                <span className="font-medium">{getAgeString(pet.birthday)}</span> old
              </p>
              
              {/* Adoption Button for Non-Shelter Pet Sales */}
              {canPurchase && (
                <div className="mt-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={isTransferring || !userProfile || userProfile.paw_dollars < petSale.price_nd}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isTransferring ? "Processing..." : `Adopt for ${petSale.price_nd} PD`}
                  </Button>
                  {userProfile && userProfile.paw_dollars < petSale.price_nd && (
                    <p className="text-red-600 text-sm mt-1">
                      Insufficient funds (You have {userProfile.paw_dollars} PD)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Adoption Button for Shelter Pets */}
            {isShelterPet && (
              <div className="mt-4">
                <ShelterPetPurchaseButton pet={pet} onPurchase={onUpdate || (() => {})} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PetProfileHeader;
