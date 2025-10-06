
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShelterSaleResult {
  success: boolean;
  error?: string;
  message?: string;
  pet_name?: string;
  paw_dollars_earned?: number;
  shelter_pet_id?: string;
}

export const useShelterSale = () => {
  const { toast } = useToast();

  const executeShelterSale = async (pet: any, userId: string) => {
    try {
      console.log("🏠 ==> STARTING SHELTER SALE EXECUTION <==");
      console.log("🏠 Pet to sell:", {
        id: pet.id,
        name: pet.pet_name,
        breed: pet.breed,
        user_id: pet.user_id,
        pet_number: pet.pet_number,
        is_locked: pet.is_locked
      });
      console.log("🏠 Seller ID:", userId);

      // Enhanced pre-validation
      if (!pet || !pet.id || !userId) {
        console.error("❌ Missing required data for shelter sale");
        toast({
          title: "Error",
          description: "Missing required pet or user information.",
          variant: "destructive",
        });
        return false;
      }

      // Double-check pet ownership before proceeding
      const { data: petOwnershipCheck, error: ownershipError } = await supabase
        .from("user_pets")
        .select("id, user_id, is_locked")
        .eq("id", pet.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (ownershipError) {
        console.error("❌ Ownership check error:", ownershipError);
        toast({
          title: "Database Error",
          description: "Failed to verify pet ownership.",
          variant: "destructive",
        });
        return false;
      }

      if (!petOwnershipCheck) {
        console.error("❌ Pet not found or not owned by user");
        toast({
          title: "Error",
          description: "Pet not found or you don't own this pet.",
          variant: "destructive",
        });
        return false;
      }

      if (petOwnershipCheck.is_locked) {
        console.error("❌ Pet is locked - cannot sell");
        toast({
          title: "Cannot sell locked pet",
          description: "Please unlock this pet before selling to the shelter.",
          variant: "destructive",
        });
        return false;
      }

      console.log("🔍 Validating shelter sale eligibility...");
      const { data: isEligible, error: validationError } = await supabase.rpc(
        'ensure_clean_shelter_sale',
        {
          pet_id_param: pet.id,
          seller_id_param: userId
        }
      );

      if (validationError) {
        console.error("❌ Validation function error:", validationError);
        toast({
          title: "Validation Error",
          description: validationError.message || "Failed to validate pet for shelter sale.",
          variant: "destructive",
        });
        return false;
      }

      if (!isEligible) {
        console.error("❌ Pet not eligible for shelter sale");
        toast({
          title: "Cannot sell pet",
          description: "This pet is already in the shelter or you don't own it.",
          variant: "destructive",
        });
        return false;
      }

      console.log("✅ Pet is eligible for shelter sale");
      
      console.log("🏠 Calling sell_pet_to_shelter function...");
      
      const { data: result, error } = await supabase.rpc('sell_pet_to_shelter', {
        pet_id_param: pet.id,
        seller_id_param: userId,
        sale_price_pd: 70,
        shelter_price_pd: 100
      });

      if (error) {
        console.error("❌ DATABASE ERROR - RAW ERROR OBJECT:", error);
        console.error("❌ ERROR MESSAGE:", error.message);
        console.error("❌ ERROR CODE:", error.code);
        console.error("❌ ERROR DETAILS:", error.details);
        console.error("❌ ERROR HINT:", error.hint);
        
        let userMessage = error.message || 'Unknown database error occurred';
        
        if (error.message) {
          if (error.message.includes('Cannot sell a locked pet')) {
            userMessage = 'Cannot sell a locked pet. Please unlock the pet first.';
          } else if (error.message.includes('Pet is already in shelter')) {
            userMessage = 'This pet is already in the shelter';
          } else if (error.message.includes('Pet not found or not owned by seller')) {
            userMessage = 'Pet not found or you no longer own this pet';
          } else if (error.message.includes('violates foreign key constraint')) {
            userMessage = 'Database integrity error. Please try again or contact support.';
          }
        }
        
        toast({
          title: "Database Error",
          description: userMessage,
          variant: "destructive",
        });
        return false;
      }

      console.log("🏠 Function response:", result);
      
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        console.error("❌ Function returned invalid result:", result);
        toast({
          title: "Error",
          description: "Invalid response from shelter sale function",
          variant: "destructive",
        });
        return false;
      }

      const shelterResult = result as unknown as ShelterSaleResult;
      
      const isSuccess = shelterResult.success === true || 
                       (typeof result === 'object' && 'pet_name' in result && 'paw_dollars_earned' in result);
      
      if (!isSuccess && shelterResult.error) {
        console.error("❌ Function returned error:", shelterResult);
        
        let userMessage = shelterResult.error || 'Unknown error occurred';
        
        if (userMessage.includes('Pet not found')) {
          userMessage = 'Pet not found or you no longer own this pet';
        } else if (userMessage.includes('already in shelter')) {
          userMessage = 'This pet is already in the shelter';
        } else if (userMessage.includes('locked')) {
          userMessage = 'Cannot sell a locked pet. Please unlock the pet first.';
        }
        
        toast({
          title: "Sale Failed",
          description: userMessage,
          variant: "destructive",
        });
        return false;
      }

      console.log("✅ ==> SHELTER SALE COMPLETED SUCCESSFULLY <==");
      console.log("✅ Pet number preserved during sale:", pet.pet_number);

      toast({
        title: "Pet sold to shelter!",
        description: `You received 70 Paw Dollars. ${pet.pet_name} (#${pet.pet_number}) is now available for adoption at 100 PD.`,
      });

      return true;
    } catch (error: any) {
      console.error("❌ ==> SHELTER SALE FAILED <==");
      console.error("❌ Error details:", error);
      
      let errorMessage = 'Unknown error occurred';
      if (error?.message) {
        errorMessage = error.message;
        
        // Handle common error patterns
        if (errorMessage.includes('locked')) {
          errorMessage = 'Cannot sell a locked pet. Please unlock the pet first.';
        } else if (errorMessage.includes('foreign key')) {
          errorMessage = 'Database integrity error. Please try again or contact support.';
        } else if (errorMessage.includes('permission denied')) {
          errorMessage = 'You do not have permission to sell this pet.';
        }
      }
      
      toast({
        title: "Error",
        description: `Failed to sell pet to shelter: ${errorMessage}`,
        variant: "destructive",
      });

      return false;
    }
  };

  return {
    executeShelterSale
  };
};
