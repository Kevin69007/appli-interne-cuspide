
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePetTransfer } from "@/hooks/usePetTransfer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import SellToShelterButton from "@/components/SellToShelterButton";
import PrivateSaleToggle from "@/components/pets/PrivateSaleToggle";
import PetLockToggle from "@/components/pets/PetLockToggle";
import PinVerificationModal from "@/components/pets/PinVerificationModal";

interface PetSaleTabProps {
  pet: any;
  isOwnProfile: boolean;
  onUpdate: () => void;
}

const PetSaleTab = ({ pet, isOwnProfile, onUpdate }: PetSaleTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { transferPetOwnership, isTransferring } = usePetTransfer();
  
  // Sale state
  const [petSaleInfo, setPetSaleInfo] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [saleValidationError, setSaleValidationError] = useState<string | null>(null);
  
  // Sale creation state
  const [salePrice, setSalePrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [isUserSpecificSale, setIsUserSpecificSale] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);

  const isOwner = user?.id === pet?.user_id;
  const isValidSale = petSaleInfo && 
                     petSaleInfo.is_active && 
                     petSaleInfo.seller_id === pet?.user_id;
  const canPurchase = !isOwnProfile && 
                     isValidSale && 
                     user?.id && 
                     user.id !== petSaleInfo.seller_id;

  useEffect(() => {
    if (pet?.id) {
      fetchPetSaleInfo();
    }
    if (user) {
      fetchUserProfile();
    }
  }, [pet?.id, user]);

  const fetchPetSaleInfo = async () => {
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
        if (actualPetOwner !== data.seller_id) {
          setPetSaleInfo(data);
          setSaleValidationError('This pet sale is invalid - the seller no longer owns this pet.');
        } else {
          setPetSaleInfo(data);
          setSaleValidationError(null);
          setSalePrice(data.price_nd.toString());
          setIsUserSpecificSale(!!data.target_username);
          setTargetUsername(data.target_username || "");
        }
      } else {
        setPetSaleInfo(null);
        setSaleValidationError(null);
      }
    } catch (error) {
      console.error("Error fetching pet sale:", error);
      setPetSaleInfo(null);
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

  const handleCreateSaleClick = () => {
    if (!user || !salePrice || !isOwner) return;

    const price = parseInt(salePrice);
    if (price < 70) {
      toast({
        title: "Invalid price",
        description: "Minimum sale price is 70 Paw Dollars",
        variant: "destructive",
      });
      return;
    }

    if (isUserSpecificSale && !targetUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a target username for user-specific sales",
        variant: "destructive",
      });
      return;
    }

    if (pet.is_locked) {
      setPendingSaleData({
        price,
        isUserSpecificSale,
        targetUsername: targetUsername.trim()
      });
      setShowPinVerification(true);
      return;
    }

    proceedWithSale();
  };

  const handlePinVerified = (pin: string) => {
    setShowPinVerification(false);
    proceedWithSale();
  };

  const proceedWithSale = async () => {
    const saleData = pendingSaleData || {
      price: parseInt(salePrice),
      isUserSpecificSale,
      targetUsername: targetUsername.trim()
    };

    setIsListing(true);
    try {
      // Verify the user still owns the pet
      const { data: petCheck, error: petError } = await supabase
        .from("user_pets")
        .select("user_id")
        .eq("id", pet.id)
        .single();

      if (petError || petCheck.user_id !== user.id) {
        toast({
          title: "Error",
          description: "You don't own this pet or it no longer exists",
          variant: "destructive",
        });
        return;
      }

      // Deactivate any existing sales for this pet
      await supabase
        .from("pet_sales")
        .update({ is_active: false })
        .eq("user_pet_id", pet.id);

      const insertData: any = {
        user_pet_id: pet.id,
        seller_id: user.id,
        price_nd: saleData.price,
        is_private: false,
      };

      if (saleData.isUserSpecificSale && saleData.targetUsername) {
        insertData.target_username = saleData.targetUsername;
      }

      const { error } = await supabase
        .from("pet_sales")
        .insert(insertData);

      if (error) {
        let errorMessage = error.message || 'Unknown database error occurred';
        if (error.message && error.message.includes('locked')) {
          errorMessage = 'Cannot sell a locked pet. Please unlock the pet first.';
        }
        throw new Error(errorMessage);
      }

      const saleType = saleData.isUserSpecificSale ? `to ${saleData.targetUsername}` : "publicly";
      toast({
        title: "Success!",
        description: `${pet.pet_name} is now listed for sale ${saleType} at ${saleData.price} PD`,
      });

      fetchPetSaleInfo();
      setPendingSaleData(null);
      onUpdate?.();
    } catch (error: any) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: error?.message || 'Failed to list pet for sale',
        variant: "destructive",
      });
    }
    setIsListing(false);
  };

  const removeSale = async () => {
    if (!petSaleInfo || !isOwner) return;

    try {
      const { error } = await supabase
        .from("pet_sales")
        .update({ is_active: false })
        .eq("id", petSaleInfo.id)
        .eq("seller_id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${pet.pet_name} has been removed from sale`,
      });

      setPetSaleInfo(null);
      setSalePrice("");
      setIsUserSpecificSale(false);
      setTargetUsername("");
      onUpdate?.();
    } catch (error) {
      console.error("Error removing sale:", error);
      toast({
        title: "Error",
        description: "Failed to remove pet from sale",
        variant: "destructive",
      });
    }
  };

  const purchasePet = async () => {
    if (!user || !petSaleInfo || !userProfile || !canPurchase) return;

    if (userProfile.paw_dollars < petSaleInfo.price_nd) {
      toast({
        title: "Insufficient funds",
        description: `You need ${petSaleInfo.price_nd} PD but only have ${userProfile.paw_dollars} PD`,
        variant: "destructive",
      });
      return;
    }

    const result = await transferPetOwnership(
      pet.id,
      petSaleInfo.seller_id,
      petSaleInfo.price_nd
    );

    if (result.success) {
      setPetSaleInfo(null);
      setSaleValidationError(null);
      setUserProfile(prev => ({ 
        ...prev, 
        paw_dollars: prev.paw_dollars - petSaleInfo.price_nd 
      }));
      onUpdate?.();
    }
  };

  if (!isOwnProfile && !petSaleInfo) {
    return (
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 rounded-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">Not For Sale</h3>
          <p className="text-muted-foreground">
            This pet is not currently available for purchase.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 rounded-lg p-6 space-y-6">
      <h3 className="text-lg font-semibold">Sale Information</h3>
      
      {/* Sale validation error */}
      {saleValidationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <h4 className="text-yellow-800 font-medium">Sale Issue Detected</h4>
          </div>
          <p className="text-yellow-700 text-sm">{saleValidationError}</p>
        </div>
      )}
      
      {/* Purchase section for non-owners */}
      {canPurchase && !saleValidationError && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-green-800 font-medium">This pet is for sale!</h4>
            <div className="text-2xl font-bold text-green-700 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {petSaleInfo.price_nd} PD
            </div>
          </div>
          {petSaleInfo.target_username && (
            <p className="text-green-700 text-sm mb-3">
              Private sale for {petSaleInfo.target_username}
            </p>
          )}
          {user ? (
            <>
              <Button
                onClick={purchasePet}
                disabled={isTransferring || !userProfile || userProfile.paw_dollars < petSaleInfo.price_nd}
                className="w-full bg-green-600 hover:bg-green-700 mb-2"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isTransferring ? "Processing..." : "Buy Now"}
              </Button>
              {userProfile && (
                <div className="text-center text-sm text-gray-600">
                  Your balance: {userProfile.paw_dollars} PD
                  {userProfile.paw_dollars >= petSaleInfo.price_nd ? (
                    <span className="text-green-600 ml-2">✓ Sufficient funds</span>
                  ) : (
                    <span className="text-red-600 ml-2">✗ Insufficient funds</span>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-green-600 text-sm">Login to purchase this pet</p>
          )}
        </div>
      )}

      {/* Owner sale management */}
      {isOwner && (
        <div className="space-y-4">
          {/* Current sale status */}
          {petSaleInfo ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium mb-2">Currently Listed for Sale</h4>
              <div className="space-y-2">
                <p className="text-blue-700">
                  Price: {petSaleInfo.price_nd} Paw Dollars
                </p>
                {petSaleInfo.target_username ? (
                  <p className="text-blue-600 text-sm">
                    Private sale for {petSaleInfo.target_username}
                  </p>
                ) : (
                  <p className="text-blue-600 text-sm">
                    Available for all users to purchase
                  </p>
                )}
                <Button
                  onClick={removeSale}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Remove from Sale
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-gray-800 font-medium mb-3">Create Sale Listing</h4>
              
              {pet.is_locked && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-3">
                  <p className="text-amber-800 text-xs">
                    🔒 This pet is locked. You'll need to enter your PIN to create a sale.
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="sale-price">Sale Price (minimum 70 PD)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sale-price"
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="70"
                      min="70"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSalePrice("70")}
                      className="px-3 whitespace-nowrap"
                    >
                      70 PD
                    </Button>
                  </div>
                </div>
                
                <PrivateSaleToggle
                  isPrivate={isUserSpecificSale}
                  onPrivateChange={setIsUserSpecificSale}
                  targetUsername={targetUsername}
                  onTargetUsernameChange={setTargetUsername}
                  disabled={isListing}
                />
                
                <Button
                  onClick={handleCreateSaleClick}
                  disabled={isListing || !salePrice || parseInt(salePrice) < 70}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {pet.is_locked ? "Verify PIN & List for Sale" : "List for Sale"}
                </Button>
              </div>
            </div>
          )}

          {/* Shelter sale section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-orange-800 font-medium mb-2">Sell to Shelter</h4>
            {pet.is_locked && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
                <p className="text-amber-800 text-xs">
                  🔒 This pet is locked. You'll need to enter your PIN to sell to shelter.
                </p>
              </div>
            )}
            <SellToShelterButton
              pet={pet}
              onSold={() => onUpdate?.()}
            />
          </div>

          {/* Pet security section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-gray-800 font-medium mb-2">Pet Security</h4>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">Pet Lock</h5>
                <p className="text-sm text-muted-foreground">
                  Protect your pet with a PIN to prevent unauthorized sales
                </p>
              </div>
              <PetLockToggle 
                pet={pet} 
                onToggle={() => onUpdate?.()} 
              />
            </div>
          </div>
        </div>
      )}

      <PinVerificationModal
        isOpen={showPinVerification}
        onClose={() => {
          setShowPinVerification(false);
          setPendingSaleData(null);
        }}
        onVerify={handlePinVerified}
        petName={pet.pet_name}
        actionType="sell"
      />
    </div>
  );
};

export default PetSaleTab;
