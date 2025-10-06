
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomPetStats {
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
}

const CreateCustomPet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      createGoldenRetriever();
    }
  }, [user]);

  const createGoldenRetriever = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a pet",
        variant: "destructive",
      });
      return;
    }

    try {
      const customStats: CustomPetStats = {
        friendliness: 85,
        playfulness: 68,
        energy: 34, // Lost stat (below breed minimum)
        loyalty: 60,
        curiosity: 80
      };

      // Generate a birthday 60-85 days before today
      const today = new Date();
      const daysBack = Math.floor(Math.random() * 26) + 60;
      const birthday = new Date(today);
      birthday.setDate(today.getDate() - daysBack);

      console.log("Creating Golden Retriever with custom stats:", customStats);

      // First create the pet record in pets table
      const petInsertData = {
        name: "Golden Retriever",
        type: 'dog' as const,
        base_friendliness: customStats.friendliness,
        base_playfulness: customStats.playfulness,
        base_energy: customStats.energy,
        base_loyalty: customStats.loyalty,
        base_curiosity: customStats.curiosity,
        image_url: "/lovable-uploads/f048abef-27e6-4a1b-aa2c-9ba11a4293c0.png"
      };

      const { data: newPet, error: petError } = await supabase
        .from("pets")
        .insert(petInsertData)
        .select()
        .single();

      if (petError) {
        console.error("Error creating pet record:", petError);
        throw new Error(`Failed to create pet record: ${petError.message}`);
      }

      console.log("Pet record created:", newPet);

      // Create user_pet record
      const userPetData = {
        user_id: user.id,
        pet_id: newPet.id,
        pet_name: "Golden Retriever",
        breed: "Golden Retriever",
        gender: "male",
        friendliness: customStats.friendliness,
        playfulness: customStats.playfulness,
        energy: customStats.energy,
        loyalty: customStats.loyalty,
        curiosity: customStats.curiosity,
        hunger: 100,
        water: 100,
        is_first_pet: false,
        adopted_at: new Date().toISOString(),
        birthday: birthday.toISOString().split('T')[0],
      };

      console.log("Creating user_pet record:", userPetData);

      const { error: insertError } = await supabase
        .from("user_pets")
        .insert(userPetData);

      if (insertError) {
        console.error("Error creating user_pet record:", insertError);
        // Clean up the pet record if user_pet creation failed
        await supabase.from("pets").delete().eq("id", newPet.id);
        throw new Error(`Failed to create user pet record: ${insertError.message}`);
      }

      console.log("Golden Retriever created successfully");

      toast({
        title: "Success!",
        description: "Golden Retriever with custom stats has been added to your profile!",
      });

      // Navigate back to profile
      navigate("/profile");

    } catch (error) {
      console.error("Error creating custom pet:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Creation failed",
        description: `Failed to create pet: ${errorMessage}`,
        variant: "destructive",
      });
      // Navigate back to profile even on error
      navigate("/profile");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg">Creating your Golden Retriever...</p>
      </div>
    </div>
  );
};

export default CreateCustomPet;
