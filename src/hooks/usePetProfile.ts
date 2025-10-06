
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePetProfile = (petId: string | undefined) => {
  const { toast } = useToast();
  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<{ mother: any; father: any }>({ mother: null, father: null });

  const fetchPetDetails = async () => {
    if (!petId) return;

    try {
      const { data: petData, error } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (*)
        `)
        .eq("id", petId)
        .single();

      if (error) throw error;

      setPet(petData);

      // Fetch parent information if this pet has parents
      if (petData.parent1_id && petData.parent2_id) {
        const { data: parentData, error: parentError } = await supabase
          .from("user_pets")
          .select("id, pet_name, gender")
          .in("id", [petData.parent1_id, petData.parent2_id]);

        if (!parentError && parentData) {
          const mother = parentData.find(p => p.gender === 'female');
          const father = parentData.find(p => p.gender === 'male');
          setParents({ mother, father });
        }
      }
    } catch (error) {
      console.error("Error fetching pet details:", error);
      toast({
        title: "Error",
        description: "Failed to load pet details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (petId) {
      fetchPetDetails();
    }
  }, [petId]);

  return {
    pet,
    loading,
    parents,
    fetchPetDetails
  };
};
