import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import SellToShelterButton from "@/components/SellToShelterButton";
import PrivateSaleToggle from "@/components/pets/PrivateSaleToggle";
import PetLockToggle from "@/components/pets/PetLockToggle";
import PinVerificationModal from "@/components/pets/PinVerificationModal";

interface PetSellSettingsProps {
  pet: any;
  onUpdate?: () => void;
}

const PetSellSettings = ({ pet, onUpdate }: PetSellSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salePrice, setSalePrice] = useState("");
  const [isListing, setIsListing] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [isUserSpecificSale, setIsUserSpecificSale] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);

  // Check if user owns this pet
  const isOwner = user?.id === pet?.user_id;

  console.log('🔧 PetSellSettings - Rendering for pet:', pet.pet_name, 'user:', user?.id, 'isOwner:', isOwner);

  // Early return if user doesn't own the pet
  if (!isOwner) {
    return (
      <div className="space-y-3 bg-gray-50 p-3 rounded-lg border">
        <h4 className="text-sm font-semibold text-gray-700">Sell Options</h4>
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
          <p className="text-orange-800 text-sm">
            Only the pet owner can modify sale settings.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchCurrentSale();
  }, [pet.id]);

  const fetchCurrentSale = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("pet_sales")
        .select("*")
        .eq("user_pet_id", pet.id)
        .eq("seller_id", user.id) // Only get sales created by the current user
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      // Double-check ownership validation
      if (data && data.seller_id === user.id) {
        setCurrentSale(data);
        setSalePrice(data.price_nd.toString());
        setIsUserSpecificSale(!!data.target_username);
        setTargetUsername(data.target_username || "");
      } else {
        setCurrentSale(null);
      }
    } catch (error) {
      console.error("Error fetching current sale:", error);
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

    // Check if pet is locked
    if (pet.is_locked) {
      setPendingSaleData({
        price,
        isUserSpecificSale,
        targetUsername: targetUsername.trim()
      });
      setShowPinVerification(true);
      return;
    }

    // Proceed with sale creation if pet is not locked
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
      // First, verify the user still owns the pet
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

      // Deactivate any existing sales for this pet to prevent duplicates
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

      // Add target username for user-specific sales
      if (saleData.isUserSpecificSale && saleData.targetUsername) {
        insertData.target_username = saleData.targetUsername;
      }

      // Create the new sale
      const { error } = await supabase
        .from("pet_sales")
        .insert(insertData);

      if (error) {
        console.error("❌ DATABASE ERROR - RAW ERROR OBJECT:", error);
        console.error("❌ ERROR MESSAGE:", error.message);
        
        // Show the actual database error instead of generic message
        let errorMessage = error.message || 'Unknown database error occurred';
        
        // Handle specific known error patterns
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

      fetchCurrentSale();
      setPendingSaleData(null);
      onUpdate?.();
    } catch (error: any) {
      console.error("Error creating sale:", error);
      
      let errorMessage = 'Failed to list pet for sale';
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsListing(false);
  };

  const removeSale = async () => {
    if (!currentSale || !isOwner) return;

    try {
      const { error } = await supabase
        .from("pet_sales")
        .update({ is_active: false })
        .eq("id", currentSale.id)
        .eq("seller_id", user.id); // Extra safety check

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${pet.pet_name} has been removed from sale`,
      });

      setCurrentSale(null);
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

  return (
    <>
      <div className="space-y-3 bg-gray-50 p-3 rounded-lg border">
        <h4 className="text-sm font-semibold text-gray-700">Sell Options</h4>
        
        {/* User-to-User Sales */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h5 className="text-blue-800 font-medium text-sm mb-2">Sell to Other Users</h5>
          
          {/* Show lock warning if pet is locked */}
          {pet.is_locked && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-3">
              <p className="text-amber-800 text-xs">
                🔒 This pet is locked. You'll need to enter your PIN to create a sale.
              </p>
            </div>
          )}
          
          {currentSale ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-md p-2">
                <p className="text-green-800 font-medium text-sm">
                  Listed for {currentSale.price_nd} PD
                </p>
                <p className="text-green-600 text-xs">
                  {currentSale.target_username 
                    ? `Private sale for ${currentSale.target_username}` 
                    : "Available for all users to purchase"
                  }
                </p>
              </div>
              <Button
                onClick={removeSale}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Remove from Sale
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="sale-price" className="text-xs">Sale Price (minimum 70 PD)</Label>
                <Input
                  id="sale-price"
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="70"
                  min="70"
                  className="text-xs h-8"
                  disabled={pet.is_locked && !showPinVerification}
                />
              </div>
              
              <PrivateSaleToggle
                isPrivate={isUserSpecificSale}
                onPrivateChange={setIsUserSpecificSale}
                targetUsername={targetUsername}
                onTargetUsernameChange={setTargetUsername}
                disabled={isListing || (pet.is_locked && !showPinVerification)}
              />
              
              <Button
                onClick={handleCreateSaleClick}
                disabled={isListing || !salePrice || parseInt(salePrice) < 70}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-xs h-8 w-full"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                {pet.is_locked ? "Verify PIN & List for Sale" : "List for Sale"}
              </Button>
            </div>
          )}
        </div>
        
        {/* Shelter Sales */}
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
          <h5 className="text-orange-800 font-medium text-sm mb-2">Sell to Shelter</h5>
          {pet.is_locked && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-2">
              <p className="text-amber-800 text-xs">
                🔒 This pet is locked. You'll need to enter your PIN to sell to shelter.
              </p>
            </div>
          )}
          <SellToShelterButton
            pet={pet}
            onSold={() => {
              if (onUpdate) {
                onUpdate();
              }
            }}
          />
        </div>

        {/* Pet Lock Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <h5 className="text-gray-800 font-medium text-sm mb-2">Pet Security</h5>
          <div className="flex items-center justify-between">
            <div>
              <h6 className="font-medium text-sm">Pet Lock</h6>
              <p className="text-xs text-muted-foreground">
                Protect your pet with a PIN to prevent unauthorized sales
              </p>
            </div>
            <PetLockToggle 
              pet={pet} 
              onToggle={() => {
                if (onUpdate) {
                  onUpdate();
                }
              }} 
            />
          </div>
        </div>
      </div>

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
    </>
  );
};

export default PetSellSettings;
