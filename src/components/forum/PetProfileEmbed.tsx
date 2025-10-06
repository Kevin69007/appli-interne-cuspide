
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle } from "lucide-react";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import PetProfileModal from "@/components/pets/PetProfileModal";
import PetPurchaseModal from "@/components/pets/PetPurchaseModal";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface PetProfileEmbedProps {
  petId: string;
}

const PetProfileEmbed = ({ petId }: PetProfileEmbedProps) => {
  const { user } = useAuth();
  const [pet, setPet] = useState<any>(null);
  const [petSaleInfo, setPetSaleInfo] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPetData();
  }, [petId]);

  const fetchPetData = async () => {
    try {
      setValidationError(null);
      
      // First fetch the pet data
      const { data: petData, error: petError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (*)
        `)
        .eq("id", petId)
        .single();

      if (petError) {
        console.error('❌ Error fetching pet:', petError);
        throw petError;
      }
      
      if (!petData) {
        console.log('❌ Pet not found with ID:', petId);
        setPet(null);
        setLoading(false);
        return;
      }

      // Fetch the owner's profile separately
      const { data: ownerProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, profile_image_url")
        .eq("id", petData.user_id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching owner profile:', profileError);
      }

      // Attach the owner profile to the pet data
      const petWithOwner = {
        ...petData,
        owner_profile: ownerProfile
      };

      console.log('✅ Pet data loaded:', {
        petName: petData.pet_name,
        breed: petData.breed,
        ownerId: petData.user_id,
        ownerUsername: ownerProfile?.username
      });

      setPet(petWithOwner);

      // Fetch sale info if pet exists
      const { data: saleData, error: saleError } = await supabase
        .from("pet_sales")
        .select("*")
        .eq("user_pet_id", petId)
        .eq("is_active", true)
        .maybeSingle();

      if (saleError) {
        console.error("❌ Error fetching sale info:", saleError);
        setPetSaleInfo(null);
        setSellerProfile(null);
        return;
      }

      if (saleData) {
        console.log('💰 Pet sale found:', {
          saleId: saleData.id,
          sellerId: saleData.seller_id,
          petOwnerId: petData.user_id,
          price: saleData.price_nd
        });
        
        // CRITICAL: Validate that the seller actually owns the pet
        if (saleData.seller_id !== petData.user_id) {
          console.error('⚠️ CRITICAL: Sale validation failed - seller does not own pet', {
            sellerId: saleData.seller_id,
            petOwnerId: petData.user_id
          });
          setValidationError('This pet sale is invalid - the seller no longer owns this pet.');
          setPetSaleInfo(null);
          setSellerProfile(null);
          return;
        }
        
        setPetSaleInfo(saleData);
        
        // Use the owner profile we already fetched
        if (ownerProfile) {
          console.log('✅ Using owner profile as seller:', ownerProfile.username);
          setSellerProfile(ownerProfile);
        } else {
          console.error('❌ No owner profile data available');
          setValidationError('Unable to load seller information.');
          setSellerProfile(null);
        }
      } else {
        // No sale data found
        console.log('ℹ️ Pet is not for sale');
        setPetSaleInfo(null);
        setSellerProfile(null);
      }
    } catch (error) {
      console.error("❌ Error fetching pet for embed:", error);
      setPet(null);
      setValidationError('Failed to load pet information.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalUpdate = () => {
    console.log('🔄 Refreshing pet data after modal update...');
    fetchPetData();
  };

  const handlePurchaseClick = () => {
    console.log('🛒 Purchase button clicked - validating data...', {
      hasPetSaleInfo: !!petSaleInfo,
      hasSellerProfile: !!sellerProfile,
      hasValidationError: !!validationError,
      isOwnPet: user?.id === pet?.user_id,
      userId: user?.id,
      sellerId: petSaleInfo?.seller_id,
      petOwnerId: pet?.user_id
    });

    if (!petSaleInfo) {
      console.error('❌ Cannot purchase: No sale information');
      setValidationError('Pet sale information is not available.');
      return;
    }

    if (!sellerProfile) {
      console.error('❌ Cannot purchase: No seller profile');
      setValidationError('Seller information is not available.');
      return;
    }

    if (validationError) {
      console.error('❌ Cannot purchase: Validation error exists:', validationError);
      return;
    }

    if (user?.id === pet?.user_id) {
      console.error('❌ Cannot purchase: User owns this pet');
      setValidationError('You cannot purchase your own pet.');
      return;
    }

    if (!user) {
      console.error('❌ Cannot purchase: User not authenticated');
      setValidationError('You must be logged in to purchase pets.');
      return;
    }

    if (petSaleInfo.seller_id !== pet?.user_id) {
      console.error('❌ Cannot purchase: Ownership mismatch');
      setValidationError('This sale is no longer valid.');
      return;
    }

    console.log('✅ All validations passed - opening purchase modal');
    setShowPurchaseModal(true);
  };

  const handlePurchaseComplete = () => {
    console.log('🎉 Purchase completed - updating state');
    setPurchasing(true);
    setShowPurchaseModal(false);
    
    // Clear sale info immediately to prevent flickering
    setPetSaleInfo(null);
    setSellerProfile(null);
    
    // Short delay to allow smooth transition, then refresh
    setTimeout(() => {
      fetchPetData();
      setPurchasing(false);
    }, 1000);
  };

  // Loading skeleton with exact fixed dimensions
  if (loading) {
    return (
      <Card className="w-full max-w-sm mx-auto h-[420px] border-pink-200 bg-gradient-to-br from-white via-pink-50 to-purple-50 shadow-lg">
        <CardContent className="p-4 h-full flex flex-col">
          <Skeleton className="w-full h-40 rounded-xl mb-4 flex-shrink-0" />
          <div className="text-center space-y-3 flex-1 flex flex-col">
            <div className="flex-grow space-y-3">
              <Skeleton className="h-6 w-32 mx-auto" />
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="h-6 flex items-center justify-center">
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pet) {
    return (
      <Card className="w-full max-w-sm mx-auto h-[420px] border-red-200 flex items-center justify-center">
        <CardContent className="p-4 text-center">
          <p className="text-red-600 text-sm">Pet not found</p>
        </CardContent>
      </Card>
    );
  }

  const isForSale = petSaleInfo && petSaleInfo.is_active && !validationError;
  const isOwnPet = user?.id === pet?.user_id;
  const canPurchase = isForSale && !isOwnPet && user && sellerProfile && !purchasing;

  return (
    <>
      <Card className="w-full max-w-sm mx-auto h-[420px] border-pink-200 bg-gradient-to-br from-white via-pink-50 to-purple-50 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Fixed height image container */}
          <div className="w-full h-40 rounded-xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex-shrink-0 border-3 border-pink-300 mb-4 shadow-inner">
            <PetImageDisplay
              pet={{
                pet_name: pet.pet_name,
                breed: pet.breed,
                pets: pet.pets
              }}
              className="w-full h-full object-contain p-2"
            />
          </div>
          
          {/* Content area with improved spacing */}
          <div className="text-center flex-1 flex flex-col">
            {/* Pet basic info */}
            <div className="mb-3">
              <h3 className="text-xl font-bold text-pink-800 mb-2">{pet.pet_name}</h3>
              <div className="flex items-center justify-center gap-2 text-sm mb-2">
                <span className="px-3 py-1 bg-pink-200 text-pink-800 rounded-full font-medium">
                  {pet.breed}
                </span>
                <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full font-medium capitalize">
                  {pet.gender}
                </span>
              </div>
              
              {/* Sale status */}
              {isForSale && !purchasing && (
                <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full font-medium text-sm mb-2">
                  For Sale: {petSaleInfo.price_nd} PD
                </span>
              )}
              {purchasing && (
                <span className="inline-block px-3 py-1 bg-blue-200 text-blue-800 rounded-full font-medium text-sm mb-2">
                  Processing...
                </span>
              )}
            </div>

            {/* Validation error */}
            {validationError && !purchasing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-yellow-800 text-xs font-medium">Sale Issue</p>
                </div>
                <p className="text-yellow-700 text-xs mt-1">{validationError}</p>
              </div>
            )}
            
            {/* Buttons - moved closer to content */}
            <div className="mt-auto space-y-2">
              <Button
                onClick={() => setShowModal(true)}
                size="sm"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 flex items-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
                View Profile
              </Button>
              
              {canPurchase && (
                <Button
                  onClick={handlePurchaseClick}
                  size="sm"
                  disabled={purchasing}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 flex items-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {purchasing ? 'Processing...' : `Buy for ${petSaleInfo.price_nd} PD`}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PetProfileModal
        pet={pet}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={handleModalUpdate}
        isOwnProfile={isOwnPet}
      />

      {showPurchaseModal && petSaleInfo && sellerProfile && !validationError && (
        <PetPurchaseModal
          pet={pet}
          petSaleInfo={petSaleInfo}
          sellerProfile={sellerProfile}
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </>
  );
};

export default PetProfileEmbed;
