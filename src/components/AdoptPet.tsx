
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/profile/ProfileLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBreedStatConfig, generateStatInRange } from "@/utils/breedStatConfig";
import { getAllBreeds, dogBreeds, getBreedImage, getAdoptionCost, isMaleRareBreed } from "@/utils/breedImages";
import { recordPetAdoptionTransaction } from "@/utils/transactionUtils";
import AdoptPetCard from "@/components/adopt/AdoptPetCard";
import { useNavigate } from "react-router-dom";

interface Pet {
  id: string;
  name: string;
  type: string;
  image_url: string;
  breed: string;
  gender: string;
  birthday: string;
  base_friendliness: number;
  base_playfulness: number;
  base_energy: number;
  base_loyalty: number;
  base_curiosity: number;
}

const AdoptPet = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [userDefaultGender, setUserDefaultGender] = useState<string>('male');
  const [isFirstPet, setIsFirstPet] = useState<boolean>(false);
  const [adoptionCost, setAdoptionCost] = useState<number>(150);

  const availableBreeds = getAllBreeds();

  // Optimized: Generate pet synchronously without async operations
  const generateRandomPetForBreed = (breed: string, userPreferredGender: string, isFirstPetAdoption: boolean = false) => {
    const breedConfig = getBreedStatConfig(breed);
    
    const today = new Date();
    const daysBack = Math.floor(Math.random() * 26) + 60;
    const birthday = new Date(today);
    birthday.setDate(today.getDate() - daysBack);

    // Determine gender: 
    // - For first pet adoption, Torties are always female (no male Torties allowed)
    // - For subsequent adoptions, Torties can be male or female based on user preference
    // - Other breeds use user preference
    let gender = userPreferredGender;
    if (breed === 'Tortie') {
      if (isFirstPetAdoption) {
        gender = 'female'; // Force female for first pet
      } else {
        // Allow user preference for subsequent adoptions
        gender = userPreferredGender;
      }
    }

    return {
      id: `pet-${crypto.randomUUID()}`,
      name: breed.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      type: dogBreeds.includes(breed) ? 'dog' : 'cat',
      breed: breed,
      gender: gender,
      image_url: getBreedImage(breed),
      birthday: birthday.toISOString().split('T')[0],
      base_friendliness: generateStatInRange(breedConfig.friendliness.min, breedConfig.friendliness.max),
      base_playfulness: generateStatInRange(breedConfig.playfulness.min, breedConfig.playfulness.max),
      base_energy: generateStatInRange(breedConfig.energy.min, breedConfig.energy.max),
      base_loyalty: generateStatInRange(breedConfig.loyalty.min, breedConfig.loyalty.max),
      base_curiosity: generateStatInRange(breedConfig.curiosity.min, breedConfig.curiosity.max),
    };
  };

  // Optimized: Generate all pets synchronously 
  const generateAvailablePets = (userPreferredGender: string, isFirstPetAdoption: boolean = false) => {
    return availableBreeds.map(breed => generateRandomPetForBreed(breed, userPreferredGender, isFirstPetAdoption));
  };

  // Optimized: Fetch user gender preference once
  const fetchUserGenderPreference = async () => {
    if (!user?.id) return 'male';
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("default_adopt_gender")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user gender preference:", error);
        return 'male';
      }
      
      return profile?.default_adopt_gender || 'male';
    } catch (error) {
      console.error("Error in fetchUserGenderPreference:", error);
      return 'male';
    }
  };

  // Optimized: Fetch profile and check first pet status in one go
  const fetchProfileAndFirstPetStatus = async () => {
    if (!user) return;

    try {
      // Fetch profile and existing pets count in parallel
      const [profileResult, existingPetsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("paw_dollars")
          .eq("id", user.id)
          .single(),
        supabase
          .from("user_pets")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
      ]);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
      } else {
        setProfile(profileResult.data);
      }

      if (existingPetsResult.error) {
        console.error("Error checking existing pets:", existingPetsResult.error);
      } else {
        const isFirst = !existingPetsResult.data || existingPetsResult.data.length === 0;
        const cost = isFirst ? 0 : 150;
        setIsFirstPet(isFirst);
        setAdoptionCost(cost);
      }
    } catch (error) {
      console.error("Profile/first pet fetch error:", error);
    }
  };

  const adoptFromAvailable = async (pet: Pet, petName: string, gender: string) => {
    if (!user || !profile) return;

    // Check if it's a male rare breed and prevent as first pet
    if (isMaleRareBreed(pet.breed, gender) && isFirstPet) {
      toast({
        title: "Cannot Adopt as First Pet",
        description: "Rare male Torties cannot be your first pet. Please adopt another pet first.",
        variant: "destructive",
      });
      return;
    }

    // Calculate actual adoption cost based on breed and gender
    const actualCost = getAdoptionCost(pet.breed, gender, isFirstPet);

    setAdopting(pet.id);
    try {
      // Check if user can afford the pet
      if (!isFirstPet && profile.paw_dollars < actualCost) {
        toast({
          title: "Insufficient Funds",
          description: `You need ${actualCost.toLocaleString()} PawDollars to adopt this ${isMaleRareBreed(pet.breed, gender) ? 'rare ' : ''}pet.`,
          variant: "destructive",
        });
        return;
      }

      const { data: petData, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("name", pet.type)
        .single();

      if (petError) {
        console.error("Error finding pet:", petError);
        toast({
          title: "Error",
          description: "Could not find pet data.",
          variant: "destructive",
        });
        return;
      }

      const { data: newPet, error: insertError } = await supabase
        .from("user_pets")
        .insert({
          user_id: user.id,
          pet_id: petData.id,
          pet_name: petName,
          breed: pet.breed,
          gender: gender.toLowerCase(),
          friendliness: pet.base_friendliness,
          playfulness: pet.base_playfulness,
          energy: pet.base_energy,
          loyalty: pet.base_loyalty,
          curiosity: pet.base_curiosity,
          birthday: pet.birthday,
          is_first_pet: isFirstPet,
          hunger: 100,
          water: 100,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating pet:", insertError);
        toast({
          title: "Adoption Failed",
          description: "Could not adopt pet. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!isFirstPet && actualCost > 0) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ paw_dollars: profile.paw_dollars - actualCost })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating balance:", updateError);
          await supabase.from("user_pets").delete().eq("id", newPet.id);
          toast({
            title: "Payment Failed",
            description: "Could not process payment. Adoption cancelled.",
            variant: "destructive",
          });
          return;
        }

        await recordPetAdoptionTransaction(user.id, newPet.id, petName, actualCost, isFirstPet);
      }

      const rarePetText = isMaleRareBreed(pet.breed, gender) ? ' This rare male Tortie cannot breed!' : '';
      toast({
        title: "Congratulations!",
        description: `You have successfully adopted ${petName}!${isFirstPet ? ' (Free first pet!)' : ''}${rarePetText}`,
        variant: "default",
      });

      // Update first pet status if this was their first pet
      if (isFirstPet) {
        setIsFirstPet(false);
        setAdoptionCost(150);
      }

      // Optimized: Generate replacement pet synchronously
      const newPetOfSameBreed = generateRandomPetForBreed(pet.breed, userDefaultGender, false);
      setAvailablePets(prev => prev.map(p => 
        p.id === pet.id ? newPetOfSameBreed : p
      ));

      await fetchProfileAndFirstPetStatus();
    } catch (error) {
      console.error("Error adopting pet:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Adoption Failed",
        description: `Failed to adopt pet: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setAdopting(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Optimized: Run all fetches in parallel, then generate pets synchronously
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Run these in parallel for better performance
      const [userPreference] = await Promise.all([
        fetchUserGenderPreference(),
        fetchProfileAndFirstPetStatus() // This updates state directly
      ]);
      
      setUserDefaultGender(userPreference);
      
      // Wait a moment for isFirstPet state to be updated by fetchProfileAndFirstPetStatus
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Generate pets synchronously - no more slow async operations
      const pets = generateAvailablePets(userPreference, isFirstPet);
      setAvailablePets(pets);
    } finally {
      setLoading(false);
    }
  };

  // Optimized: Refresh pets instantly without any async operations
  const handleRefreshAvailablePets = () => {
    const pets = generateAvailablePets(userDefaultGender, isFirstPet);
    setAvailablePets(pets);
  };

  if (loading) {
    return (
      <ProfileLayout>
        <div className="loading-container">
          <PageSkeleton />
        </div>
      </ProfileLayout>
    );
  }

  if (!user) return null;

  return (
    <ProfileLayout>
      <div className="space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pink-800 mb-2 flex items-center justify-center gap-2">
            <Heart className="w-7 h-7 text-red-500" />
            Adopt a Pet
            <Heart className="w-7 h-7 text-red-500" />
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your perfect companion from our available pets!
          </p>
        </div>

        <div className="min-h-[600px]">
          <Tabs defaultValue="dogs" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-64 grid-cols-2 rounded-2xl shadow-lg bg-pink-100/80 backdrop-blur-sm border border-pink-200">
                <TabsTrigger 
                  value="dogs" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-pink-500 data-[state=active]:text-white hover:bg-pink-200 text-pink-700"
                >
                  Dogs
                </TabsTrigger>
                <TabsTrigger 
                  value="cats" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-pink-500 data-[state=active]:text-white hover:bg-pink-200 text-pink-700"
                >
                  Cats
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-4">
                {profile ? (
                  <Badge className="text-lg px-6 py-3 rounded-full shadow-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900">
                    🐾 {profile.paw_dollars} PawDollars
                  </Badge>
                ) : (
                  <Badge className="text-lg px-6 py-3 rounded-full shadow-lg bg-red-200 text-red-700">
                    Profile Error
                  </Badge>
                )}
                <Button 
                  onClick={handleRefreshAvailablePets}
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <TabsContent value="dogs" className="mt-6 min-h-[500px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availablePets.filter(pet => pet.type === 'dog').map((pet) => (
                  <AdoptPetCard
                    key={pet.id}
                    pet={pet}
                    onAdopt={adoptFromAvailable}
                    isAdopting={adopting === pet.id}
                    userBalance={profile?.paw_dollars || 0}
                    userDefaultGender={userDefaultGender}
                    isFirstPet={isFirstPet}
                    adoptionCost={0}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="cats" className="mt-6 min-h-[500px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availablePets.filter(pet => pet.type === 'cat').map((pet) => (
                  <AdoptPetCard
                    key={pet.id}
                    pet={pet}
                    onAdopt={adoptFromAvailable}
                    isAdopting={adopting === pet.id}
                    userBalance={profile?.paw_dollars || 0}
                    userDefaultGender={userDefaultGender}
                    isFirstPet={isFirstPet}
                    adoptionCost={0}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default AdoptPet;
