
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LockResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const usePetLock = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const verifyPetPin = async (petId: string, pin: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_pet_pin', {
        pet_id_param: petId,
        provided_pin: pin
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const lockPet = async (petId: string, pin: string): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('lock_pet', {
        pet_id_param: petId,
        pin_text: pin
      });

      if (error) throw error;

      const result = data as unknown as LockResult;
      
      if (result.success) {
        toast({
          title: "Pet Locked",
          description: result.message || "Pet has been locked successfully",
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to lock pet",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error locking pet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to lock pet",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const unlockPet = async (petId: string, pin: string): Promise<boolean> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('unlock_pet', {
        pet_id_param: petId,
        provided_pin: pin
      });

      if (error) throw error;

      const result = data as unknown as LockResult;
      
      if (result.success) {
        toast({
          title: "Pet Unlocked",
          description: result.message || "Pet has been unlocked successfully",
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unlock pet",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error unlocking pet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unlock pet",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    verifyPetPin,
    lockPet,
    unlockPet,
    isProcessing
  };
};
