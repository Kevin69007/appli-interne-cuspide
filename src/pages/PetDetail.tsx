import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Utensils, Droplets, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PetStats from "@/components/pet-profile/PetStats";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import { calculatePetNumber } from "@/utils/petNumberUtils";

interface PetDetail {
  id: string;
  pet_name: string;
  breed: string;
  gender: string;
  description: string;
  birthday: string;
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
  hunger: number;
  water: number;
  last_fed: string;
  last_watered: string;
  adopted_at: string;
  pets: {
    name: string;
    type: string;
  };
  sale?: {
    id: string;
    price_nd: number;
    seller_id: string;
    is_active: boolean;
    is_private: boolean;
    secret_link: string;
    created_at: string;
    updated_at: string;
    user_pet_id: string;
  };
}

const PetDetail = () => {
  const { petNumber } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (petNumber) {
      fetchPetDetail();
    }
  }, [petNumber]);

  const fetchPetDetail = async () => {
    try {
      const { data: pets, error } = await supabase
        .from("user_pets")
        .select(`
          *,
          pets (name, type),
          pet_sales!left (
            id,
            price_nd,
            seller_id,
            is_active,
            is_private,
            secret_link,
            created_at,
            updated_at,
            user_pet_id
          )
        `)
        .not("pets", "is", null);

      if (error) throw error;

      // Find the pet with matching pet number
      const foundPet = pets?.find(p => calculatePetNumber(p) === parseInt(petNumber!));
      
      if (foundPet && foundPet.pet_sales && foundPet.pet_sales.length > 0) {
        setPet({
          ...foundPet,
          sale: foundPet.pet_sales[0]
        });
      } else if (foundPet) {
        setPet(foundPet);
      } else {
        toast({
          title: "Pet not found",
          description: "This pet doesn't exist or has been removed.",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching pet detail:", error);
      toast({
        title: "Error",
        description: "Failed to load pet details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const interactWithPet = async (action: string) => {
    if (!user || !pet) return;

    setInteracting(true);
    try {
      let updateData: any = {};

      switch (action) {
        case 'feed':
          updateData = {
            hunger: Math.min(100, pet.hunger + 25),
            last_fed: new Date().toISOString()
          };
          break;
        case 'water':
          updateData = {
            water: Math.min(100, pet.water + 25),
            last_watered: new Date().toISOString()
          };
          break;
        case 'play':
          updateData = {
            hunger: Math.max(0, pet.hunger - 10),
            water: Math.max(0, pet.water - 5)
          };
          break;
        case 'clean':
          updateData = {
            hunger: Math.max(0, pet.hunger - 5)
          };
          break;
      }

      const { error } = await supabase
        .from("user_pets")
        .update(updateData)
        .eq("id", pet.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `You ${action}ed ${pet.pet_name}!`,
      });

      fetchPetDetail();
    } catch (error) {
      console.error(`Error ${action}ing pet:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} pet`,
        variant: "destructive",
      });
    } finally {
      setInteracting(false);
    }
  };

  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days old`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} old`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8">Loading pet details...</div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8">Pet not found</div>
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
            {pet.pet_name} (#{calculatePetNumber(pet)})
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
                    {pet.breed} {pet.pets.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {calculateAge(pet.birthday)} • {pet.gender}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pet Stats */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
            <CardHeader>
              <CardTitle className="text-pink-800">Pet Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <PetStats pet={pet} />
            </CardContent>
          </Card>
        </div>

        {/* Interactive Actions */}
        {user && (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200 mt-6">
            <CardHeader>
              <CardTitle className="text-pink-800">Interact with {pet.pet_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => interactWithPet('feed')}
                  disabled={interacting}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Utensils className="w-6 h-6 mb-2" />
                  Feed
                </Button>
                <Button
                  onClick={() => interactWithPet('water')}
                  disabled={interacting}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Droplets className="w-6 h-6 mb-2" />
                  Water
                </Button>
                <Button
                  onClick={() => interactWithPet('play')}
                  disabled={interacting}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Heart className="w-6 h-6 mb-2" />
                  Play
                </Button>
                <Button
                  onClick={() => interactWithPet('clean')}
                  disabled={interacting}
                  variant="outline"
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <Sparkles className="w-6 h-6 mb-2" />
                  Clean
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

export default PetDetail;
