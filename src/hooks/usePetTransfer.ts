
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TransferResult {
  success: boolean;
  error?: string;
  message?: string;
}

// Type for the RPC response
interface TransferResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export const usePetTransfer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTransferring, setIsTransferring] = useState(false);

  const transferPetOwnership = async (
    petId: string,
    sellerId: string,
    salePrice: number
  ): Promise<TransferResult> => {
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Prevent users from buying their own pets
    if (user.id === sellerId) {
      return { success: false, error: "You cannot buy your own pet" };
    }

    setIsTransferring(true);

    try {
      console.log('🔄 Starting pet transfer process...', {
        petId,
        sellerId,
        buyerId: user.id,
        salePrice,
        userAuthenticated: !!user
      });

      // Enhanced pre-transfer validation: Check sale exists and validate user-specific sales
      const { data: saleData, error: saleError } = await supabase
        .from('pet_sales')
        .select(`
          *,
          user_pets!inner(user_id, pet_name)
        `)
        .eq('user_pet_id', petId)
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .single();

      if (saleError) {
        console.error('❌ Sale validation failed:', saleError);
        const errorMessage = saleError.code === 'PGRST116' 
          ? "Sale not found or no longer active" 
          : "Failed to validate sale";
        
        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      const actualPetOwner = saleData.user_pets.user_id;
      console.log('🐾 Pre-transfer validation:', {
        petName: saleData.user_pets.pet_name,
        petOwner: actualPetOwner,
        sellerId: sellerId,
        isOwnerSelling: actualPetOwner === sellerId,
        salePrice: saleData.price_nd,
        targetUsername: saleData.target_username
      });

      // Ensure the seller actually owns the pet
      if (actualPetOwner !== sellerId) {
        console.error('❌ Ownership mismatch: Pet owner is not the seller');
        const errorMessage = "Invalid sale: seller does not own this pet";
        
        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      // CRITICAL: Validate user-specific sales (case-insensitive)
      if (saleData.target_username) {
        console.log('🔐 Validating user-specific sale for:', saleData.target_username);
        
        // Get buyer's username
        const { data: buyerProfile, error: buyerError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (buyerError || !buyerProfile) {
          console.error('❌ Failed to get buyer profile:', buyerError);
          const errorMessage = "Failed to verify buyer information";
          
          toast({
            title: "Purchase Failed",
            description: errorMessage,
            variant: "destructive",
          });
          
          return { success: false, error: errorMessage };
        }

        // Case-insensitive comparison
        if (buyerProfile.username.toLowerCase() !== saleData.target_username.toLowerCase()) {
          console.error('❌ Authorization failed: buyer username mismatch', {
            buyerUsername: buyerProfile.username,
            targetUsername: saleData.target_username,
            buyerUsernameLower: buyerProfile.username.toLowerCase(),
            targetUsernameLower: saleData.target_username.toLowerCase()
          });
          
          const errorMessage = `This pet is reserved for ${saleData.target_username} only. You cannot purchase this pet.`;
          
          toast({
            title: "Purchase Not Allowed",
            description: errorMessage,
            variant: "destructive",
          });
          
          return { success: false, error: errorMessage };
        }

        console.log('✅ User-specific sale validation passed for:', buyerProfile.username);
      }

      // Get buyer and seller usernames for transaction descriptions
      const { data: buyerProfile, error: buyerProfileError } = await supabase
        .from('profiles')
        .select('paw_dollars, username')
        .eq('id', user.id)
        .single();

      if (buyerProfileError) {
        console.error('❌ Failed to get buyer profile:', buyerProfileError);
        const errorMessage = "Failed to verify buyer funds";
        
        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      const { data: sellerProfile, error: sellerProfileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', sellerId)
        .single();

      if (sellerProfileError) {
        console.error('❌ Failed to get seller profile:', sellerProfileError);
      }

      if (buyerProfile.paw_dollars < salePrice) {
        const errorMessage = `Insufficient funds. You have ${buyerProfile.paw_dollars} PD but need ${salePrice} PD`;
        
        toast({
          title: "Insufficient Funds",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      console.log('✅ All pre-transfer validations passed, calling transfer function...');

      // Call the database function to perform the transfer
      const { data, error } = await supabase.rpc('transfer_pet_ownership', {
        pet_id_param: petId,
        seller_id_param: sellerId,
        buyer_id_param: user.id,
        sale_price_param: salePrice
      });

      if (error) {
        console.error('❌ RPC call failed:', error);
        
        toast({
          title: "Purchase Failed",
          description: error.message || "Transfer failed",
          variant: "destructive",
        });
        
        return { success: false, error: error.message };
      }

      console.log('✅ Transfer RPC result:', data);

      // Safely convert Json to TransferResponse
      const result = data as unknown as TransferResponse;

      if (!result || !result.success) {
        const errorMessage = result?.error || "Transfer failed";
        console.error('❌ Transfer failed with result:', result);
        
        toast({
          title: "Purchase Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      // Record enhanced ledger transactions with pet names and usernames
      try {
        console.log('📝 Recording enhanced ledger transactions...');
        
        const petName = saleData.user_pets.pet_name;
        const buyerUsername = buyerProfile.username;
        const sellerUsername = sellerProfile?.username || 'Unknown User';

        // Record buyer transaction with enhanced description
        const { error: buyerLedgerError } = await supabase
          .from("paw_dollar_transactions")
          .insert({
            user_id: user.id,
            amount: -salePrice,
            type: 'pet_purchase',
            description: `Purchased ${petName} from ${sellerUsername} (-${salePrice} PD)`,
            status: 'completed'
          });

        if (buyerLedgerError) {
          console.error("⚠️ Error recording buyer ledger transaction:", buyerLedgerError);
        } else {
          console.log("✅ Buyer ledger transaction recorded");
        }

        // Record seller transaction with enhanced description
        const { error: sellerLedgerError } = await supabase
          .from("paw_dollar_transactions")
          .insert({
            user_id: sellerId,
            amount: salePrice,
            type: 'pet_sale',
            description: `Sold ${petName} to ${buyerUsername} (+${salePrice} PD)`,
            status: 'completed'
          });

        if (sellerLedgerError) {
          console.error("⚠️ Error recording seller ledger transaction:", sellerLedgerError);
        } else {
          console.log("✅ Seller ledger transaction recorded");
        }

        // Verify the seller's balance was actually updated
        const { data: updatedSellerProfile, error: verifyError } = await supabase
          .from('profiles')
          .select('paw_dollars, username')
          .eq('id', sellerId)
          .single();

        if (!verifyError && updatedSellerProfile) {
          console.log('✅ Verified seller balance after transfer:', {
            sellerId,
            username: updatedSellerProfile.username,
            pawDollars: updatedSellerProfile.paw_dollars
          });
        }

      } catch (ledgerError) {
        console.error("⚠️ Error with enhanced ledger operations:", ledgerError);
        // Don't fail the transfer for ledger errors since the main transfer succeeded
      }

      console.log('🎉 Pet transfer completed successfully!');
      
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${saleData.user_pets.pet_name} for ${salePrice} Paw Dollars!`,
      });

      return { success: true, message: result.message };

    } catch (error) {
      console.error('❌ Pet transfer failed with exception:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsTransferring(false);
    }
  };

  return {
    transferPetOwnership,
    isTransferring
  };
};
