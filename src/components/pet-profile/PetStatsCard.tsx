import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Edit, AlertTriangle } from "lucide-react";
import PetSellSettings from "./PetSellSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePetTransfer } from "@/hooks/usePetTransfer";
import { renderOddieStats, renderBreedStats, hasOddStats } from "@/utils/statBarUtils";

interface PetStatsCardProps {
  pet: any;
  onUpdate?: () => void;
  petSaleInfo?: any;
}

const PetStatsCard = ({ pet, onUpdate, petSaleInfo: propSaleInfo }: PetStatsCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transferPetOwnership, isTransferring } = usePetTransfer();
  const [petSale, setPetSale] = useState<any>(propSaleInfo || null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [saleValidationError, setSaleValidationError] = useState<string | null>(null);
  
  const isOwnProfile = user?.id === pet?.user_id;
  
  // Validate that the sale is legitimate - seller must own the pet
  const isValidSale = petSale && 
                     petSale.is_active && 
                     petSale.seller_id === pet?.user_id;
  
  // Check if this is a valid sale that can be purchased
  const canPurchase = !isOwnProfile && 
                     isValidSale && 
                     user?.id && 
                     user.id !== petSale.seller_id;
  
  // Enhanced ownership check
  const canEditSale = isOwnProfile && isValidSale && user?.id === petSale?.seller_id;

  console.log('🐾 PetStatsCard Debug:', {
    isOwnProfile,
    userId: user?.id,
    petUserId: pet?.user_id,
    petSale,
    isValidSale,
    canPurchase,
    canEditSale,
    propSaleInfo
  });

  const getStatColor = (value: number) => {
    const percentage = ((value - 0) / (100 - 0)) * 100;
    if (percentage >= 60) return "text-green-600";
    return "text-gray-600";
  };

  const isOddie = pet.breed?.toLowerCase() === 'oddie' || pet.pet_name === 'Oddie';

  useEffect(() => {
    // Use prop sale info if provided, otherwise fetch
    if (propSaleInfo !== undefined) {
      console.log('🔧 Using prop sale info:', propSaleInfo);
      // Validate the prop sale info before using it
      if (propSaleInfo && propSaleInfo.seller_id === pet?.user_id) {
        setPetSale(propSaleInfo);
        setSaleValidationError(null);
      } else if (propSaleInfo) {
        console.warn('⚠️ Invalid prop sale info - seller does not own pet');
        setPetSale(propSaleInfo); // Keep the sale data for error display
        setSaleValidationError('This pet sale is invalid - the seller no longer owns this pet.');
      } else {
        setPetSale(null);
        setSaleValidationError(null);
      }
    } else {
      console.log('🔧 Fetching sale info for pet:', pet.id);
      fetchPetSale();
    }
    
    if (user) {
      fetchUserProfile();
    }
  }, [pet.id, user, propSaleInfo, pet?.user_id]);

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

      console.log('🔍 Fetched sale data:', data);

      if (data) {
        const actualPetOwner = data.user_pets.user_id;
        if (actualPetOwner !== data.seller_id) {
          console.warn('⚠️ Invalid sale detected: seller does not own the pet', {
            sellerId: data.seller_id,
            actualOwner: actualPetOwner
          });
          
          setPetSale(data);
          setSaleValidationError('This pet sale is invalid - the seller no longer owns this pet.');
        } else {
          setPetSale(data);
          setSaleValidationError(null);
        }
      } else {
        setPetSale(null);
        setSaleValidationError(null);
      }
    } catch (error) {
      console.error("Error fetching pet sale:", error);
      setPetSale(null);
      setSaleValidationError(null);
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

  const purchasePet = async () => {
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
      // Update local state immediately - pet is no longer for sale
      setPetSale(null);
      setSaleValidationError(null);
      setUserProfile(prev => ({ 
        ...prev, 
        paw_dollars: prev.paw_dollars - petSale.price_nd 
      }));
      
      // Call parent update
      if (onUpdate) {
        onUpdate();
      }
    }
  };

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800">Pet Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pet Stats with proper styling */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-pink-800">Personality Traits</h3>
          <div className="bg-pink-50 p-3 rounded-lg space-y-4">
            {isOddie ? (
              renderOddieStats(pet, getStatColor, true)
            ) : (
              renderBreedStats(pet, getStatColor, true)
            )}
          </div>
        </div>
        
        {/* Show sell settings for own profile - directly under stats */}
        {isOwnProfile && (
          <div className="border-t pt-4">
            <PetSellSettings 
              pet={pet}
              onUpdate={onUpdate}
            />
          </div>
        )}
        
        {/* Show error message for invalid sales */}
        {saleValidationError && (
          <div className="border-t pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <h3 className="text-yellow-800 font-medium">Sale Issue Detected</h3>
              </div>
              <p className="text-yellow-700 text-sm">
                {saleValidationError}
              </p>
            </div>
          </div>
        )}
        
        {/* Show purchase option for non-owners if pet is for sale and sale is valid */}
        {canPurchase && !saleValidationError && (
          <div className="border-t pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-green-800 font-medium">This pet is for sale!</h3>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Price: {petSale.price_nd} Paw Dollars
              </p>
              {user ? (
                <Button
                  onClick={purchasePet}
                  disabled={isTransferring || !userProfile || userProfile.paw_dollars < petSale.price_nd}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isTransferring ? "Processing..." : "Buy Now"}
                </Button>
              ) : (
                <p className="text-green-600 text-sm">Login to purchase this pet</p>
              )}
              {userProfile && userProfile.paw_dollars < petSale.price_nd && (
                <p className="text-red-600 text-sm mt-2">
                  Insufficient funds (You have {userProfile.paw_dollars} PD)
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PetStatsCard;
