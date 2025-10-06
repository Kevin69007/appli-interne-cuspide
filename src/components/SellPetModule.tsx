
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import PrivateSaleToggle from "./pets/PrivateSaleToggle";
import PinVerificationModal from "./pets/PinVerificationModal";

interface SellPetModuleProps {
  pet: {
    id: string;
    pet_name: string;
    breed?: string;
    is_locked?: boolean;
    pets: {
      name: string;
      type: string;
      image_url: string;
    };
  };
  onBack: () => void;
  onSellComplete: () => void;
}

const SellPetModule = ({ pet, onBack, onSellComplete }: SellPetModuleProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saleData, setSaleData] = useState({
    price: 70,
    isPrivate: false,
    isUserSpecific: false,
    targetUsername: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);

  const handleCreateSaleClick = () => {
    if (!user || saleData.price < 70) {
      toast({
        title: "Invalid price",
        description: "Minimum sale price is 70 PD",
        variant: "destructive",
      });
      return;
    }

    if (saleData.isUserSpecific && !saleData.targetUsername.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a target username for private sales",
        variant: "destructive",
      });
      return;
    }

    if (pet.is_locked) {
      setShowPinVerification(true);
    } else {
      proceedWithSale();
    }
  };

  const handlePinVerified = (pin: string) => {
    setShowPinVerification(false);
    proceedWithSale();
  };

  const proceedWithSale = async () => {
    setLoading(true);

    try {
      const insertData: any = {
        user_pet_id: pet.id,
        seller_id: user.id,
        price_nd: saleData.price,
        is_private: saleData.isPrivate
      };

      // Add target username for user-specific sales
      if (saleData.isUserSpecific && saleData.targetUsername.trim()) {
        insertData.target_username = saleData.targetUsername.trim();
      }

      const { data: saleResult, error } = await supabase
        .from("pet_sales")
        .insert(insertData)
        .select('secret_link')
        .single();

      if (error) throw error;

      if (saleData.isPrivate && saleResult?.secret_link) {
        const secretLink = `${window.location.origin}/pet-sale/${saleResult.secret_link}`;
        navigator.clipboard.writeText(secretLink);
        toast({
          title: "Private sale created!",
          description: "Secret link copied to clipboard",
        });
      } else if (saleData.isUserSpecific) {
        toast({
          title: "Private sale created!",
          description: `Only ${saleData.targetUsername} can purchase this pet`,
        });
      } else {
        toast({
          title: "Public sale created!",
          description: "Your pet is now listed for sale",
        });
      }

      onSellComplete();
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to create sale",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {pet.pet_name}
        </Button>

        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Sell {pet.pet_name}</CardTitle>
            <CardDescription>Set up a sale for your pet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <PetImageDisplay
                  pet={pet}
                  className="w-full h-full object-cover rounded-lg border-2 border-green-200"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{pet.pet_name}</h3>
                <p className="text-muted-foreground">{pet.pets.name} ({pet.pets.type})</p>
                {pet.is_locked && (
                  <p className="text-sm text-amber-600 font-medium">🔒 This pet is locked</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (minimum 70 PD)</label>
                <Input
                  type="number"
                  min="70"
                  value={saleData.price}
                  onChange={(e) => setSaleData({ ...saleData, price: parseInt(e.target.value) || 70 })}
                  placeholder="Enter sale price"
                />
                <p className="text-xs text-muted-foreground mt-1">PD = Paw Dollars (Nova Dollars)</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="private-sale"
                    checked={saleData.isPrivate}
                    onChange={(e) => setSaleData({ ...saleData, isPrivate: e.target.checked })}
                  />
                  <label htmlFor="private-sale" className="text-sm">
                    Private sale (generates secret link)
                  </label>
                </div>

                <PrivateSaleToggle
                  isPrivate={saleData.isUserSpecific}
                  onPrivateChange={(isUserSpecific) => setSaleData({ ...saleData, isUserSpecific })}
                  targetUsername={saleData.targetUsername}
                  onTargetUsernameChange={(targetUsername) => setSaleData({ ...saleData, targetUsername })}
                  disabled={loading}
                />
              </div>

              {pet.is_locked && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700">
                    This pet is locked and will require PIN verification before creating the sale.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateSaleClick} 
                  disabled={loading || saleData.price < 70}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {loading ? "Creating Sale..." : "Create Sale"}
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PinVerificationModal
        isOpen={showPinVerification}
        onClose={() => setShowPinVerification(false)}
        onVerify={handlePinVerified}
        petName={pet.pet_name}
        actionType="sell"
      />
    </>
  );
};

export default SellPetModule;
