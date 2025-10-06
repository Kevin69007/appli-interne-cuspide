
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PetSelection from "@/components/PetSelection";
import { useToast } from "@/hooks/use-toast";
import SignupModal from "@/components/landing/SignupModal";
import LandingHero from "@/components/landing/LandingHero";
import PetSelectionSection from "@/components/landing/PetSelectionSection";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { dogBreeds, catBreeds, getBreedImage, getAvailableGenders } from "@/utils/breedImages";
import { generateNaturalStat } from "@/utils/statGeneration";
import { getBreedStatConfig } from "@/utils/breedStatConfig";

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
  isLostStat?: boolean;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [hasFirstPet, setHasFirstPet] = useState<boolean | null>(null);
  const [selectedGenders, setSelectedGenders] = useState<{[key: string]: string}>({});
  const [selectedPetType, setSelectedPetType] = useState<string>("all");
  const [profileCheckComplete, setProfileCheckComplete] = useState(false);

  console.log("Index page - Auth state:", { 
    hasUser: !!user, 
    userId: user?.id, 
    authLoading, 
    hasFirstPet,
    profileCheckComplete
  });

  // Use curated breed lists instead of all breeds
  const availableBreeds = [...dogBreeds, ...catBreeds];

  // Check if authenticated user has pets - with better error handling
  const checkIfUserHasFirstPet = async () => {
    if (!user) {
      setHasFirstPet(null);
      setProfileCheckComplete(true);
      return;
    }
    
    try {
      console.log("Index - Checking if user has pets:", user.id);
      const { data: pets, error } = await supabase
        .from("user_pets")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (error) {
        console.error("Index - Error checking user pets:", error);
        // Don't fail completely on error, just assume no pets
        setHasFirstPet(false);
        setProfileCheckComplete(true);
        return;
      }

      const hasPets = pets && pets.length > 0;
      console.log("Index - User has pets:", hasPets);
      setHasFirstPet(hasPets);
      setProfileCheckComplete(true);
      
      if (hasPets) {
        console.log("Index - Redirecting to profile...");
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("Index - Error checking user pets:", error);
      setHasFirstPet(false);
      setProfileCheckComplete(true);
    }
  };

  // Better initialization logic
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        checkIfUserHasFirstPet();
      } else {
        setHasFirstPet(null);
        setProfileCheckComplete(true);
        fetchAvailablePets();
      }
    }
  }, [user, authLoading]);

  // Filter pets when type changes
  useEffect(() => {
    if (selectedPetType === "all") {
      setFilteredPets(availablePets);
    } else {
      setFilteredPets(availablePets.filter(pet => pet.type === selectedPetType));
    }
  }, [selectedPetType, availablePets]);

  const fetchAvailablePets = async () => {
    setLoading(true);
    try {
      const pets = [];
      const initialGenders: {[key: string]: string} = {};
      
      // Generate pets with generic stat generation and NO lost stats for first pets
      for (const breed of availableBreeds) {
        const today = new Date();
        const daysBack = Math.floor(Math.random() * 26) + 60;
        const birthday = new Date(today);
        birthday.setDate(today.getDate() - daysBack);
        
        // Get breed configuration
        const breedConfig = getBreedStatConfig(breed);
        
        // Use generic stat generation that avoids exact min/max values and NO lost stats
        const generatedStats = {
          friendliness: generateNaturalStat(breedConfig.friendliness.min, breedConfig.friendliness.max),
          playfulness: generateNaturalStat(breedConfig.playfulness.min, breedConfig.playfulness.max),
          energy: generateNaturalStat(breedConfig.energy.min, breedConfig.energy.max),
          loyalty: generateNaturalStat(breedConfig.loyalty.min, breedConfig.loyalty.max),
          curiosity: generateNaturalStat(breedConfig.curiosity.min, breedConfig.curiosity.max),
        };

        const petId = `pet-${crypto.randomUUID()}`;
        const availableGenders = getAvailableGenders(breed);
        // For first pet adoption (landing page), Torties must be female - no male Torties allowed
        const defaultGender = breed === 'Tortie' ? 'female' : (availableGenders.includes('male') ? 'male' : 'female');
        
        pets.push({
          id: petId,
          name: breed.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          type: dogBreeds.includes(breed) ? 'dog' : 'cat',
          breed: breed,
          gender: defaultGender,
          birthday: birthday.toISOString().split('T')[0],
          image_url: getBreedImage(breed),
          base_friendliness: generatedStats.friendliness,
          base_playfulness: generatedStats.playfulness,
          base_energy: generatedStats.energy,
          base_loyalty: generatedStats.loyalty,
          base_curiosity: generatedStats.curiosity,
          isLostStat: false // NEVER allow lost stats for first pets on landing page
        });

        initialGenders[petId] = defaultGender;
      }

      setAvailablePets(pets);
      setSelectedGenders(initialGenders);
    } catch (error) {
      console.error("Error fetching pets:", error);
      toast({
        title: "Error",
        description: "Failed to load available pets. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenderSelection = (petId: string, gender: string) => {
    console.log("Index - Gender selection:", petId, gender);
    setSelectedGenders(prev => ({
      ...prev,
      [petId]: gender
    }));
    
    // Update the pet's gender in the availablePets array to reflect the selection
    setAvailablePets(prevPets => 
      prevPets.map(pet => 
        pet.id === petId 
          ? { ...pet, gender: gender.toLowerCase() }
          : pet
      )
    );
  };

  const handleAdoptPet = (pet: Pet) => {
    if (!user) {
      // Ensure the pet has the correct gender before opening signup modal
      const updatedPet = {
        ...pet,
        gender: selectedGenders[pet.id] || pet.gender
      };
      setSelectedPet(updatedPet);
      setIsSignupModalOpen(true);
      return;
    }
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
    setSelectedPet(null);
  };

  const handlePetAdopted = () => {
    navigate("/profile");
  };

  // Show loading while auth is loading or profile check is not complete
  if (authLoading || !profileCheckComplete) {
    console.log("Index - Showing loading state");
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 relative">
        <div className="absolute inset-0 opacity-5 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <Navigation />
        <main className="page-container pt-20 relative z-10">
          <div className="content-wrapper">
            <div className="loading-container">
              <PageSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // If user is authenticated and doesn't have pets, show PetSelection
  if (user && hasFirstPet === false) {
    console.log("Index - Showing PetSelection for authenticated user without pets");
    return <PetSelection onPetAdopted={handlePetAdopted} />;
  }

  // If user is authenticated and has pets, they should be redirected to profile
  if (user && hasFirstPet === true) {
    console.log("Index - User has pets but not redirected, showing loading");
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 relative">
        <div className="absolute inset-0 opacity-5 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <Navigation />
        <main className="page-container pt-20 relative z-10">
          <div className="content-wrapper">
            <div className="loading-container">
              <PageSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  console.log("Index - Showing landing page for non-authenticated users");
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 relative">
      <div className="absolute inset-0 opacity-5 bg-repeat" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
      
      <Navigation />
      
      <main className="page-container pt-20 relative z-10">
        <div className="content-wrapper">
          <LandingHero />
          <div className="min-h-[600px]">
            <PetSelectionSection
              filteredPets={filteredPets}
              selectedPetType={selectedPetType}
              selectedGenders={selectedGenders}
              loading={loading}
              onPetTypeChange={setSelectedPetType}
              onGenderSelection={handleGenderSelection}
              onAdoptPet={handleAdoptPet}
            />
          </div>
        </div>
      </main>

      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={handleCloseSignupModal}
        selectedPet={selectedPet}
      />
    </div>
  );
};

export default Index;
