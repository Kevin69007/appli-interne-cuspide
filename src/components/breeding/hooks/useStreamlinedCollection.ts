
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CollectionResult {
  success: boolean;
  error?: string;
  message?: string;
  babies_transferred?: number;
}

export const useStreamlinedCollection = () => {
  const [isCollecting, setIsCollecting] = useState(false);
  const { toast } = useToast();

  const collectBabies = async (breedingPairId: string, userId: string): Promise<boolean> => {
    if (isCollecting) return false;
    
    setIsCollecting(true);
    
    try {
      console.log(`🔄 Starting baby collection for breeding pair: ${breedingPairId}`);
      
      // Check if babies exist before attempting collection
      const { data: existingBabies, error: babiesCheckError } = await supabase
        .from('litter_babies')
        .select('id, pet_name, breed')
        .eq('breeding_pair_id', breedingPairId);
      
      if (babiesCheckError) {
        console.error('❌ Error checking for babies:', babiesCheckError);
        throw babiesCheckError;
      }
      
      if (!existingBabies || existingBabies.length === 0) {
        console.log('⚠️ No babies found for collection');
        toast({
          title: "No babies to collect",
          description: "This breeding pair has no babies available for collection.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log(`📊 Found ${existingBabies.length} babies ready for collection:`, existingBabies);
      
      // Call the database function for collection
      const { data: rawResult, error } = await supabase.rpc('collect_breeding_babies', {
        breeding_pair_id_param: breedingPairId,
        user_id_param: userId
      });

      if (error) {
        console.error('❌ Collection function error:', error);
        throw error;
      }

      // Cast the result to our expected type
      const result = rawResult as unknown as CollectionResult;

      if (!result?.success) {
        console.error('❌ Collection failed:', result?.error);
        toast({
          title: "Collection Failed",
          description: result?.error || "Unable to collect babies",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Collection successful:', result);
      
      toast({
        title: "Babies Collected Successfully!",
        description: `${result.babies_transferred} babies have been transferred to your profile.`,
      });

      // Dispatch events to refresh components
      window.dispatchEvent(new CustomEvent('breeding-complete'));
      window.dispatchEvent(new CustomEvent('litter-collected'));
      window.dispatchEvent(new CustomEvent('pets-update'));
      
      return true;

    } catch (error: any) {
      console.error('❌ Collection error:', error);
      
      let errorMessage = "An unexpected error occurred during collection.";
      
      if (error.message?.includes("not found")) {
        errorMessage = "Breeding pair not found or you don't have permission to collect these babies.";
      } else if (error.message?.includes("weaning")) {
        errorMessage = "Babies are still weaning. Please wait until the weaning period is complete.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Collection Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsCollecting(false);
    }
  };

  return {
    collectBabies,
    isCollecting
  };
};
