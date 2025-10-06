
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePetPurchaseData = (pet: any, petSaleInfo: any, isOpen: boolean) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserProfile();
      validateSale();
    }
  }, [user, isOpen, pet, petSaleInfo]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("paw_dollars, username")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setValidationError("Failed to load your profile information.");
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setValidationError("Failed to load your profile information.");
    }
  };

  const validateSale = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const { data: currentSale, error: saleError } = await supabase
        .from("pet_sales")
        .select(`
          *,
          user_pets!inner(user_id, pet_name)
        `)
        .eq("user_pet_id", pet.id)
        .eq("seller_id", petSaleInfo.seller_id)
        .eq("is_active", true)
        .maybeSingle();

      if (saleError) {
        console.error("Error validating sale:", saleError);
        setValidationError("Failed to validate sale information.");
        return;
      }

      if (!currentSale) {
        setValidationError("This sale is no longer active or available.");
        return;
      }

      if (currentSale.user_pets.user_id !== petSaleInfo.seller_id) {
        setValidationError("The seller no longer owns this pet.");
        return;
      }

      if (user?.id === currentSale.user_pets.user_id) {
        setValidationError("You cannot purchase your own pet.");
        return;
      }

      // Check if this is a user-specific sale and validate username (case-insensitive)
      if (currentSale.target_username) {
        // Get current user's username
        const { data: buyerProfile, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user?.id)
          .single();

        if (profileError || !buyerProfile) {
          setValidationError("Failed to verify your username. Please try again.");
          return;
        }

        // Case-insensitive comparison
        if (buyerProfile.username.toLowerCase() !== currentSale.target_username.toLowerCase()) {
          setValidationError(`This pet is reserved for ${currentSale.target_username} only. You cannot purchase this pet.`);
          return;
        }
      }

      console.log('✅ Sale validation passed:', {
        petName: currentSale.user_pets.pet_name,
        sellerId: currentSale.seller_id,
        petOwnerId: currentSale.user_pets.user_id,
        price: currentSale.price_nd,
        targetUsername: currentSale.target_username,
        buyerUsername: userProfile?.username
      });

    } catch (error) {
      console.error("Error during sale validation:", error);
      setValidationError("Failed to validate sale. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return {
    userProfile,
    isValidating,
    validationError,
    validateSale
  };
};
