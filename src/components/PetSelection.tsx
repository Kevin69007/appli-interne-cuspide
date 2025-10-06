
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  dogBreeds,
  catBreeds,
  getBreedImage,
  getAvailableGenders
} from "@/utils/breedImages";
import { generatePetStatsWithBreedConfig } from "@/utils/statGeneration";
import { getBreedStatConfig } from "@/utils/breedStatConfig";

interface Pet {
  id: string;
  pet_id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthday: string;
  image_url: string;
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
  isLostStat?: boolean;
}

interface PetSelectionProps {
  onPetAdopted: () => void;
}

const PetSelection = ({ onPetAdopted }: PetSelectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petName, setPetName] = useState("");
  const [selectedGenders, setSelectedGenders] = useState<{[key: string]: string}>({});
  const availableBreeds = [...dogBreeds, ...catBreeds];

  useEffect(() => {
    generatePets();
  }, []);

  const generatePets = () => {
    const newPets: Pet[] = [];
    const initialGenders: {[key: string]: string} = {};

    availableBreeds.forEach((breed) => {
      const breedConfig = getBreedStatConfig(breed);
      
      // Generate stats with breed configuration
      const generatedStats = generatePetStatsWithBreedConfig(breedConfig);

      const today = new Date();
      const daysBack = Math.floor(Math.random() * 26) + 60;
      const birthday = new Date(today);
      birthday.setDate(today.getDate() - daysBack);

      const petId = `pet-${crypto.randomUUID()}`;
      const availableGenders = getAvailableGenders(breed);
      // For first pet adoption, Torties must be female - no male Torties allowed
      const defaultGender = breed === 'Tortie' ? 'female' : (availableGenders.includes('male') ? 'male' : 'female');
      
      const pet: Pet = {
        id: petId,
        pet_id: crypto.randomUUID(),
        name: breed,
        type: dogBreeds.includes(breed) ? 'dog' : 'cat',
        breed: breed,
        gender: defaultGender,
        birthday: birthday.toISOString().split('T')[0],
        image_url: getBreedImage(breed),
        friendliness: generatedStats.friendliness,
        playfulness: generatedStats.playfulness,
        energy: generatedStats.energy,
        loyalty: generatedStats.loyalty,
        curiosity: generatedStats.curiosity,
        isLostStat: generatedStats.isLostStat
      };

      newPets.push(pet);
      initialGenders[petId] = defaultGender;
    });

    setPets(newPets);
    setSelectedGenders(initialGenders);
  };

  const handleGenderSelection = (petId: string, gender: string) => {
    console.log("PetSelection - Gender selection:", petId, gender);
    setSelectedGenders(prev => ({
      ...prev,
      [petId]: gender
    }));
    
    // Update the pet's gender in the pets array to reflect the selection
    setPets(prevPets => 
      prevPets.map(pet => 
        pet.id === petId 
          ? { ...pet, gender: gender.toLowerCase() }
          : pet
      )
    );
  };

  const handlePetSelection = (pet: Pet) => {
    // Ensure the pet has the correct gender from selection
    const updatedPet = {
      ...pet,
      gender: selectedGenders[pet.id] || pet.gender
    };
    setSelectedPet(updatedPet);
    setPetName(pet.name);
  };

  const handleAdoptPet = async () => {
    if (!user || !selectedPet) return;

    setLoading(true);
    try {
      const finalGender = selectedGenders[selectedPet.id] || selectedPet.gender;
      console.log("PetSelection - Adopting pet with gender:", finalGender);
      
      // First create the pet record in pets table
      const { data: newPet, error: petError } = await supabase
        .from("pets")
        .insert({
          name: selectedPet.breed,
          type: selectedPet.type as 'dog' | 'cat',
          base_friendliness: selectedPet.friendliness,
          base_playfulness: selectedPet.playfulness,
          base_energy: selectedPet.energy,
          base_loyalty: selectedPet.loyalty,
          base_curiosity: selectedPet.curiosity,
          image_url: selectedPet.image_url
        })
        .select()
        .single();

      if (petError) {
        console.error("Error creating pet:", petError);
        throw petError;
      }

      // Then create the user_pet record
      const { data, error } = await supabase
        .from("user_pets")
        .insert({
          user_id: user.id,
          pet_id: newPet.id,
          pet_name: petName,
          breed: selectedPet.breed,
          gender: finalGender,
          friendliness: selectedPet.friendliness,
          playfulness: selectedPet.playfulness,
          energy: selectedPet.energy,
          loyalty: selectedPet.loyalty,
          curiosity: selectedPet.curiosity,
          birthday: selectedPet.birthday,
          description: `A brand new ${selectedPet.breed} ready for adventure!`,
          hunger: 100,
          water: 100,
          is_first_pet: true
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating user pet:", error);
        throw error;
      }

      toast({
        title: "Pet Adopted!",
        description: `${petName} has joined your family.`,
      });
      onPetAdopted();
      navigate("/profile");
    } catch (error) {
      console.error("Error adopting pet:", error);
      toast({
        title: "Error",
        description: "Failed to adopt pet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your First Pet
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select a pet to start your adventure!
          </p>
        </div>
        {pets.map((pet) => {
          const availableGenders = getAvailableGenders(pet.breed);
          // For first pet adoption, Torties can only be female
          const firstPetAvailableGenders = pet.breed === 'Tortie' ? ['female'] : availableGenders;
          
          return (
            <Card key={pet.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={pet.image_url}
                    alt={pet.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
                    <p className="text-sm text-gray-500">{pet.breed}</p>
                    <div className="mt-2">
                      <Label className="text-sm font-medium">Select Gender</Label>
                      <RadioGroup
                        value={selectedGenders[pet.id] || pet.gender}
                        onValueChange={(value) => handleGenderSelection(pet.id, value)}
                        className="flex items-center space-x-4 mt-1"
                      >
                        {firstPetAvailableGenders.includes('male') && (
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="male" id={`${pet.id}-male`} />
                            <Label htmlFor={`${pet.id}-male`} className="text-sm">♂️ Male</Label>
                          </div>
                        )}
                        {firstPetAvailableGenders.includes('female') && (
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem value="female" id={`${pet.id}-female`} />
                            <Label htmlFor={`${pet.id}-female`} className="text-sm">♀️ Female</Label>
                          </div>
                        )}
                      </RadioGroup>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePetSelection(pet)}
                      className="mt-2"
                    >
                      Select
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {selectedPet && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Customize {selectedPet.name}'s Name
            </h3>
            <div className="mb-4">
              <Label htmlFor="petName" className="block text-sm font-medium text-gray-700">
                Pet Name
              </Label>
              <Input
                type="text"
                id="petName"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Gender: {selectedGenders[selectedPet.id] === 'female' ? '♀️ Female' : '♂️ Male'}
              </Label>
            </div>
            <Button
              onClick={handleAdoptPet}
              disabled={loading}
              className="mt-4 w-full"
            >
              {loading ? "Adopting..." : "Adopt Pet"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetSelection;
