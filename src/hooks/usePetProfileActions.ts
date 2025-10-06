
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePetProfileActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updatePetDescription = async (petId: string, description: string) => {
    console.log('🔄 Updating pet description:', { petId, description });
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("user_pets")
        .update({ description: description.trim() })
        .eq("id", petId);

      if (error) {
        console.error("Error updating pet description:", error);
        toast({
          title: "Error",
          description: "Failed to update pet description",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Pet description updated successfully');
      toast({
        title: "Success!",
        description: "Pet description updated successfully",
      });
      return true;
    } catch (error) {
      console.error("Error updating pet description:", error);
      toast({
        title: "Error",
        description: "Failed to update pet description",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePetAboutSection = async (petId: string, aboutSection: string) => {
    console.log('🔄 Updating pet about section:', { petId, aboutSection });
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("user_pets")
        .update({ about_section: aboutSection.trim() })
        .eq("id", petId);

      if (error) {
        console.error("Error updating pet about section:", error);
        toast({
          title: "Error",
          description: "Failed to update pet about section",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Pet about section updated successfully');
      toast({
        title: "Success!",
        description: "Pet about section updated successfully",
      });
      return true;
    } catch (error) {
      console.error("Error updating pet about section:", error);
      toast({
        title: "Error",
        description: "Failed to update pet about section",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updatePetDescription,
    updatePetAboutSection,
    loading
  };
};
