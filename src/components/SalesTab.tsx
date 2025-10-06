
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Eye, EyeOff, Lock } from "lucide-react";
import { getActiveBreeders } from "@/utils/breedingUtils";
import PrivateSaleToggle from "./pets/PrivateSaleToggle";
import PinVerificationModal from "./pets/PinVerificationModal";
import PetLockIcon from "./pets/PetLockIcon";

interface SalesTabProps {
  userPets: any[];
  onUpdate: () => void;
  isOwnProfile?: boolean;
  profileUserId?: string;
}

const SalesTab = ({ userPets, onUpdate, isOwnProfile = true, profileUserId }: SalesTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSales, setActiveSales] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [isUserSpecificSale, setIsUserSpecificSale] = useState(false);
  const [targetUsername, setTargetUsername] = useState("");
  const [activeBreeders, setActiveBreeders] = useState<string[]>([]);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);

  useEffect(() => {
    fetchActiveSales();
    if (isOwnProfile && user) {
      fetchActiveBreeders();
    }
  }, [profileUserId, isOwnProfile, user]);

  const fetchActiveBreeders = async () => {
    if (!user) return;
    const breeders = await getActiveBreeders(user.id);
    setActiveBreeders(breeders);
  };

  const fetchActiveSales = async () => {
    const targetUserId = profileUserId || user?.id;
    if (!targetUserId) return;

    const { data, error } = await supabase
      .from("pet_sales")
      .select(`
        *,
        user_pet:user_pets (
          pet_name,
          is_locked,
          pets (name, type, image_url)
        )
      `)
      .eq("seller_id", targetUserId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching sales:", error);
    } else {
      setActiveSales(data || []);
    }
  };

  const handleCreateSaleClick = () => {
    if (!user || !selectedPet || !salePrice) return;

    // Check if pet is actively breeding
    if (activeBreeders.includes(selectedPet)) {
      toast({
        title: "Cannot sell breeding pet",
        description: "This pet is currently involved in breeding and cannot be sold until the breeding process is complete.",
        variant: "destructive",
      });
      return;
    }

    const price = parseInt(salePrice);
    if (price < 50) {
      toast({
        title: "Invalid price",
        description: "Minimum sale price is 50 Paw Dollars",
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

    // Check if selected pet is locked
    const selectedPetData = userPets.find(pet => pet.id === selectedPet);
    if (selectedPetData?.is_locked) {
      setPendingSaleData({
        selectedPet,
        price,
        isUserSpecificSale,
        targetUsername: targetUsername.trim()
      });
      setShowPinVerification(true);
      return;
    }

    // Proceed with sale if pet is not locked
    proceedWithSale();
  };

  const handlePinVerified = (pin: string) => {
    setShowPinVerification(false);
    proceedWithSale();
  };

  const proceedWithSale = async () => {
    const saleData = pendingSaleData || {
      selectedPet,
      price: parseInt(salePrice),
      isUserSpecificSale,
      targetUsername: targetUsername.trim()
    };

    const insertData: any = {
      user_pet_id: saleData.selectedPet,
      seller_id: user.id,
      price_nd: saleData.price,
      is_private: false,
    };

    // Add target username for user-specific sales
    if (saleData.isUserSpecificSale && saleData.targetUsername) {
      insertData.target_username = saleData.targetUsername;
    }

    const { error } = await supabase
      .from("pet_sales")
      .insert(insertData);

    if (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to create sale listing",
        variant: "destructive",
      });
    } else {
      const saleType = saleData.isUserSpecificSale ? `to ${saleData.targetUsername}` : "publicly";
      toast({
        title: "Success!",
        description: `Pet listed for sale ${saleType}`,
      });
      setSelectedPet(null);
      setSalePrice("");
      setIsUserSpecificSale(false);
      setTargetUsername("");
      setPendingSaleData(null);
      fetchActiveSales();
      onUpdate();
    }
  };

  const removeSale = async (saleId: string) => {
    const { error } = await supabase
      .from("pet_sales")
      .update({ is_active: false })
      .eq("id", saleId);

    if (error) {
      console.error("Error removing sale:", error);
      toast({
        title: "Error",
        description: "Failed to remove sale listing",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Sale listing removed",
      });
      fetchActiveSales();
      onUpdate();
    }
  };

  const availablePets = userPets.filter(pet => 
    !activeSales.some(sale => sale.user_pet_id === pet.id)
  );

  const getAvailablePetsForSale = () => {
    return availablePets.filter(pet => !activeBreeders.includes(pet.id));
  };

  const availablePetsForSale = getAvailablePetsForSale();

  return (
    <>
      <div className="space-y-6">
        {/* Only show creation forms if it's the user's own profile */}
        {isOwnProfile && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800">Create New Sale</CardTitle>
              <CardDescription>List one of your pets for sale to other users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Pet</label>
                <select
                  value={selectedPet || ""}
                  onChange={(e) => setSelectedPet(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Choose a pet...</option>
                  {availablePetsForSale.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.pet_name} ({pet.pets.name}) {pet.is_locked ? "🔒" : ""}
                    </option>
                  ))}
                </select>
                {activeBreeders.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Pets currently breeding cannot be sold
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sale Price (Paw Dollars)</label>
                <Input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Minimum 50 PD"
                  min="50"
                />
              </div>

              <PrivateSaleToggle
                isPrivate={isUserSpecificSale}
                onPrivateChange={setIsUserSpecificSale}
                targetUsername={targetUsername}
                onTargetUsernameChange={setTargetUsername}
              />

              <Button
                onClick={handleCreateSaleClick}
                disabled={!selectedPet || !salePrice}
                className="bg-pink-600 hover:bg-pink-700 w-full"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                List for Sale
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-pink-800">
            {isOwnProfile ? "Active Sales" : "Pet Sales"}
          </h3>
          
          {activeSales.map((sale) => (
            <Card key={sale.id} className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {sale.user_pet.pet_name}
                      <PetLockIcon isLocked={sale.user_pet.is_locked} />
                    </CardTitle>
                    <CardDescription>
                      {sale.user_pet.pets.name} ({sale.user_pet.pets.type})
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="secondary">{sale.price_nd} PD</Badge>
                    {sale.is_private && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <EyeOff className="w-4 h-4" />
                        Private
                      </div>
                    )}
                    {sale.target_username && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Lock className="w-4 h-4" />
                        For {sale.target_username}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              {isOwnProfile && (
                <CardContent>
                  <Button
                    onClick={() => removeSale(sale.id)}
                    variant="outline"
                    size="sm"
                  >
                    Remove Listing
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}

          {activeSales.length === 0 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {isOwnProfile ? "No active sales" : "No pet sales available"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PinVerificationModal
        isOpen={showPinVerification}
        onClose={() => {
          setShowPinVerification(false);
          setPendingSaleData(null);
        }}
        onVerify={handlePinVerified}
        petName={pendingSaleData ? userPets.find(p => p.id === pendingSaleData.selectedPet)?.pet_name : ""}
        actionType="sell"
      />
    </>
  );
};

export default SalesTab;
