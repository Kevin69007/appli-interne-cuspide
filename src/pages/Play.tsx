import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/profile/ProfileLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Heart, RefreshCw, Coins } from "lucide-react";
import { useAdoption } from "@/hooks/useAdoption";
import AdoptablePetGrid from "@/components/play/AdoptablePetGrid";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { getBreedStatConfig, generateStatInRange } from "@/utils/breedStatConfig";
import { generateLostStat, generateNaturalStat } from "@/utils/statGeneration";
import { dogBreeds, catBreeds, getBreedImage } from "@/utils/breedImages";
import { LOSTIE_CONFIG } from "@/config/lostie";

const Play = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [petsLoading, setPetsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [availableDogs, setAvailableDogs] = useState<any[]>([]);
  const [availableCats, setAvailableCats] = useState<any[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<{[key: string]: string}>({});
  const [cachedFemaleStats, setCachedFemaleStats] = useState<{[key: string]: any}>({});
  const [userDefaultGender, setUserDefaultGender] = useState<string>('female');
  const [isFemaleToggle, setIsFemaleToggle] = useState<boolean>(false);
  const hasLoadedRef = useRef(false);

  // Helper function to generate adoption stats with rare lostie chance
  const generateAdoptionStats = (breedConfig: any) => {
    // Generate normal stats within breed ranges
    const normalStats = {
      friendliness: generateNaturalStat(breedConfig.friendliness.min, breedConfig.friendliness.max),
      playfulness: generateNaturalStat(breedConfig.playfulness.min, breedConfig.playfulness.max),
      energy: generateNaturalStat(breedConfig.energy.min, breedConfig.energy.max),
      loyalty: generateNaturalStat(breedConfig.loyalty.min, breedConfig.loyalty.max),
      curiosity: generateNaturalStat(breedConfig.curiosity.min, breedConfig.curiosity.max)
    };

    // Very rare chance to convert one stat to a lost stat (1 in 10,000)
    if (Math.random() < LOSTIE_CONFIG.PLAY_PAGE_CHANCE) {
      const statNames = Object.keys(normalStats) as Array<keyof typeof normalStats>;
      const randomStatName = statNames[Math.floor(Math.random() * statNames.length)];
      normalStats[randomStatName] = generateLostStat();
    }

    return normalStats;
  };

  // Optimized: Generate pet synchronously without database calls
  const generateRandomPetForBreed = (breed: string) => {
    const breedConfig = getBreedStatConfig(breed);
    
    const today = new Date();
    const daysBack = Math.floor(Math.random() * 26) + 60;
    const birthday = new Date(today);
    birthday.setDate(today.getDate() - daysBack);

    const petStats = generateAdoptionStats(breedConfig);
    const defaultGender = userDefaultGender;

    return {
      id: `pet-${crypto.randomUUID()}`,
      name: breed.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      type: dogBreeds.includes(breed) ? 'dog' : 'cat',
      breed: breed,
      gender: defaultGender,
      image_url: getBreedImage(breed),
      birthday: birthday.toISOString().split('T')[0],
      base_friendliness: petStats.friendliness,
      base_playfulness: petStats.playfulness,
      base_energy: petStats.energy,
      base_loyalty: petStats.loyalty,
      base_curiosity: petStats.curiosity,
    };
  };

  // Generate all pets synchronously
  const generateAvailablePets = () => {
    const dogs = dogBreeds.map(breed => generateRandomPetForBreed(breed));
    const cats = catBreeds.map(breed => generateRandomPetForBreed(breed));
    
    setAvailableDogs(dogs);
    setAvailableCats(cats);
    
    // Initialize selectedGenders based on current toggle state
    const defaultGender = isFemaleToggle ? 'Female' : 'Male';
    const initialGenders: {[key: string]: string} = {};
    [...dogs, ...cats].forEach(pet => {
      initialGenders[pet.id] = defaultGender;
    });
    setSelectedGenders(initialGenders);
    setCachedFemaleStats({});
  };

  const fetchProfile = async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("paw_dollars, default_adopt_gender")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
        // Update user default gender preference
        const preference = data?.default_adopt_gender || 'female';
        setUserDefaultGender(preference);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleGenderSelection = (petId: string, gender: string) => {
    setSelectedGenders(prev => ({
      ...prev,
      [petId]: gender
    }));
  };

  const handleGenderToggle = (checked: boolean) => {
    setIsFemaleToggle(checked);
    const newDefaultGender = checked ? 'female' : 'male';
    setUserDefaultGender(newDefaultGender);
    
    // Update all pets' genders based on toggle state
    const newGenders: {[key: string]: string} = {};
    [...availableDogs, ...availableCats].forEach(pet => {
      newGenders[pet.id] = checked ? 'Female' : 'Male';
    });
    setSelectedGenders(newGenders);
  };

  const updatePetAfterAdoption = (oldPetId: string, breed: string) => {
    const newPetOfSameBreed = generateRandomPetForBreed(breed);
    
    if (dogBreeds.includes(breed)) {
      setAvailableDogs(prev => prev.map(p => 
        p.id === oldPetId ? newPetOfSameBreed : p
      ));
    } else {
      setAvailableCats(prev => prev.map(p => 
        p.id === oldPetId ? newPetOfSameBreed : p
      ));
    }
    
    setSelectedGenders(prev => {
      const updated = { ...prev };
      delete updated[oldPetId];
      updated[newPetOfSameBreed.id] = userDefaultGender.charAt(0).toUpperCase() + userDefaultGender.slice(1);
      return updated;
    });

    setCachedFemaleStats(prev => {
      const updated = { ...prev };
      delete updated[oldPetId];
      return updated;
    });
  };

  const generateGenderModifiedStats = (pet: any, gender: string) => {
    if (gender === "Female") {
      if (cachedFemaleStats[pet.id]) {
        return cachedFemaleStats[pet.id];
      }

      const breedConfig = getBreedStatConfig(pet.breed);
      const femaleStatsGeneration = generateAdoptionStats(breedConfig);

      setCachedFemaleStats(prev => ({
        ...prev,
        [pet.id]: femaleStatsGeneration
      }));

      return femaleStatsGeneration;
    } else {
      return {
        friendliness: pet.base_friendliness,
        playfulness: pet.base_playfulness,
        energy: pet.base_energy,
        loyalty: pet.base_loyalty,
        curiosity: pet.base_curiosity
      };
    }
  };

  const { adopting, adoptPet } = useAdoption(
    profile,
    fetchProfile,
    updatePetAfterAdoption,
    generateGenderModifiedStats
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Optimized: Single initialization with immediate pet generation
  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      loadInitialData();
      hasLoadedRef.current = true;
    }
  }, [user]);

  const loadInitialData = async () => {
    setPetsLoading(true);
    try {
      // Fetch profile first to get gender preference
      await fetchProfile();
      // Generate pets immediately after we have the preference
      generateAvailablePets();
    } finally {
      setPetsLoading(false);
    }
  };

  const refreshPets = () => {
    generateAvailablePets();
  };

  const handleAdoptPet = (pet: any) => {
    if (profileLoading) {
      return;
    }
    
    adoptPet(pet, selectedGenders);
  };

  const getStatColor = (stat: number) => {
    if (stat < 0) return "bg-purple-500";
    if (stat >= 60) return "bg-green-500";
    return "bg-gray-400";
  };

  if (authLoading) {
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
            Choose your perfect companion!
          </p>
        </div>

        {petsLoading ? (
          <div className="loading-container">
            <PageSkeleton />
          </div>
        ) : (
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
                  {profileLoading ? (
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-pink-200 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                  ) : profile ? (
                    <div className="bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 p-1 rounded-2xl shadow-lg">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-inner">
                          <Coins className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                            {profile.paw_dollars}
                          </div>
                          <div className="text-xs text-pink-700 font-medium">
                            PawDollars
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-100/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-red-200">
                      <div className="text-red-700 font-medium">
                        Profile Error
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <Button 
                  onClick={refreshPets}
                  disabled={petsLoading}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${petsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-pink-200">
                  <span className={`text-sm font-medium transition-colors ${!isFemaleToggle ? 'text-pink-700' : 'text-pink-400'}`}>
                    Male
                  </span>
                  <Switch
                    checked={isFemaleToggle}
                    onCheckedChange={handleGenderToggle}
                    className="data-[state=checked]:bg-pink-500"
                  />
                  <span className={`text-sm font-medium transition-colors ${isFemaleToggle ? 'text-pink-700' : 'text-pink-400'}`}>
                    Female
                  </span>
                </div>
              </div>

              <TabsContent value="dogs" className="mt-6 min-h-[500px]">
                <AdoptablePetGrid
                  pets={availableDogs}
                  selectedGenders={selectedGenders}
                  onGenderChange={handleGenderSelection}
                  onAdopt={handleAdoptPet}
                  adopting={adopting}
                  getStatColor={getStatColor}
                  generateGenderModifiedStats={generateGenderModifiedStats}
                  userBalance={profile?.paw_dollars || 0}
                />
              </TabsContent>

              <TabsContent value="cats" className="mt-6 min-h-[500px]">
                <AdoptablePetGrid
                  pets={availableCats}
                  selectedGenders={selectedGenders}
                  onGenderChange={handleGenderSelection}
                  onAdopt={handleAdoptPet}
                  adopting={adopting}
                  getStatColor={getStatColor}
                  generateGenderModifiedStats={generateGenderModifiedStats}
                  userBalance={profile?.paw_dollars || 0}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-pink-200">
              <Button 
                onClick={refreshPets}
                disabled={petsLoading}
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${petsLoading ? 'animate-spin' : ''}`} />
                Refresh Pets
              </Button>
              
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-pink-200">
                <span className={`text-sm font-medium transition-colors ${!isFemaleToggle ? 'text-pink-700' : 'text-pink-400'}`}>
                  Male
                </span>
                <Switch
                  checked={isFemaleToggle}
                  onCheckedChange={handleGenderToggle}
                  className="data-[state=checked]:bg-pink-500"
                />
                <span className={`text-sm font-medium transition-colors ${isFemaleToggle ? 'text-pink-700' : 'text-pink-400'}`}>
                  Female
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
};

export default Play;
