
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePetTransfer } from "@/hooks/usePetTransfer";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PetStats from "@/components/pet-profile/PetStats";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import { calculatePetNumber } from "@/utils/petNumberUtils";

const PetSale = () => {
  const { secretLink } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { transferPetOwnership, isTransferring } = usePetTransfer();
  const [pet, setPet] = useState<any>(null);
  const [saleInfo, setSaleInfo] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canPurchase, setCanPurchase] = useState(false);
  const [purchaseBlockReason, setPurchaseBlockReason] = useState("");

  useEffect(() => {
    if (secretLink) {
      fetchPetSaleDetails();
    }
  }, [secretLink]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    // Check if user can purchase after all data is loaded
    if (user && saleInfo && userProfile) {
      checkPurchaseEligibility();
    }
  }, [user, saleInfo, userProfile]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("paw_dollars, username")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const checkPurchaseEligibility = async () => {
    if (!user || !saleInfo || !userProfile) {
      setCanPurchase(false);
      setPurchaseBlockReason("Not logged in");
      return;
    }

    // Check if this is a user-specific sale (case-insensitive)
    if (saleInfo.target_username) {
      console.log('🔐 Checking user-specific sale eligibility:', {
        targetUsername: saleInfo.target_username,
        userUsername: userProfile.username
      });
      
      // Case-insensitive comparison
      if (userProfile.username.toLowerCase() !== saleInfo.target_username.toLowerCase()) {
        setCanPurchase(false);
        setPurchaseBlockReason(`This pet is reserved for ${saleInfo.target_username} only`);
        return;
      }
    }

    // Check if user is the seller
    if (user.id === saleInfo.seller_id) {
      setCanPurchase(false);
      setPurchaseBlockReason("You cannot buy your own pet");
      return;
    }

    // Check if user has enough funds
    if (userProfile.paw_dollars < saleInfo.price_nd) {
      setCanPurchase(false);
      setPurchaseBlockReason(`Insufficient funds (You have ${userProfile.paw_dollars} PD, need ${saleInfo.price_nd} PD)`);
      return;
    }

    setCanPurchase(true);
    setPurchaseBlockReason("");
  };

  const fetchPetSaleDetails = async () => {
    try {
      // Fetch sale info by secret link
      const { data: saleData, error: saleError } = await supabase
        .from("pet_sales")
        .select("*")
        .eq("secret_link", secretLink)
        .eq("is_active", true)
        .single();

      if (saleError) throw saleError;

      if (!saleData) {
        toast({
          title: "Sale not found",
          description: "This pet sale link is invalid or has expired.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setSaleInfo(saleData);

      // Fetch pet details
      const { data: petData, error: petError } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (name, type, image_url)
        `)
        .eq("id", saleData.user_pet_id)
        .single();

      if (petError) throw petError;
      setPet(petData);

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from("profiles")
        .select("username, paw_dollars")
        .eq("id", saleData.seller_id)
        .single();

      if (sellerError) throw sellerError;
      setSellerProfile(sellerData);

    } catch (error) {
      console.error("Error fetching pet sale details:", error);
      toast({
        title: "Error",
        description: "Failed to load pet sale details",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const purchasePet = async () => {
    if (!user || !saleInfo || !userProfile || !canPurchase) return;

    const result = await transferPetOwnership(
      pet.id,
      saleInfo.seller_id,
      saleInfo.price_nd
    );

    if (result.success) {
      navigate("/profile");
    }
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return "Unknown age";
    
    const birthDate = new Date(birthday);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birthDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let ageString = "";
    if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) {
      if (ageString) ageString += ", ";
      ageString += `${months} month${months > 1 ? 's' : ''}`;
    }
    if (days > 0 || (!years && !months)) {
      if (ageString) ageString += ", ";
      ageString += `${days} day${days > 1 ? 's' : ''}`;
    }
    
    return ageString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8">Loading pet sale details...</div>
        </div>
      </div>
    );
  }

  if (!pet || !saleInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8">Pet sale not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-pink-800">
            {pet.pet_name} - For Sale
            {saleInfo.target_username && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3 inline mr-1" />
                Private Sale
              </span>
            )}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pet Image and Basic Info */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto">
                  <PetImageDisplay
                    pet={pet}
                    className="w-full h-full object-cover rounded-lg border-4 border-pink-200"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-pink-800">{pet.pet_name}</h2>
                  <p className="text-lg text-muted-foreground capitalize">
                    {pet.breed || pet.pets.name} • {pet.gender}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    #{calculatePetNumber(pet)} • {calculateAge(pet.birthday)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Seller: {sellerProfile?.username || "Unknown"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Info and Purchase */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Purchase Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700 mb-4">
                  {saleInfo.price_nd} Paw Dollars
                </div>
                
                {saleInfo.target_username && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <div className="flex items-center justify-center gap-2 text-blue-800">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Private Sale</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">
                      This pet is reserved for {saleInfo.target_username}
                    </p>
                  </div>
                )}
                
                {user ? (
                  <>
                    {canPurchase ? (
                      <Button
                        onClick={purchasePet}
                        disabled={isTransferring}
                        className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isTransferring ? "Processing..." : "Buy Now"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button disabled className="w-full text-lg py-3">
                          Cannot Purchase
                        </Button>
                        <p className="text-red-600 text-sm">
                          {purchaseBlockReason}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button disabled className="w-full text-lg py-3">
                      Login Required
                    </Button>
                    <p className="text-muted-foreground text-sm">
                      You must be logged in to purchase pets
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pet Stats */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 mt-6">
          <CardHeader>
            <CardTitle className="text-pink-800">Pet Stats & Personality</CardTitle>
          </CardHeader>
          <CardContent>
            <PetStats pet={pet} />
          </CardContent>
        </Card>

        {/* Description */}
        {pet.description && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 mt-6">
            <CardHeader>
              <CardTitle className="text-pink-800">About {pet.pet_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{pet.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PetSale;
