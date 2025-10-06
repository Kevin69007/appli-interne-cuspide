
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart } from "lucide-react";
import { getAvailableGenders } from "@/utils/breedImages";

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

interface LandingPetCardProps {
  pet: Pet;
  selectedGender: string;
  onGenderSelection: (petId: string, gender: string) => void;
  onAdoptPet: (pet: Pet) => void;
}

const LandingPetCard = ({ pet, selectedGender, onGenderSelection, onAdoptPet }: LandingPetCardProps) => {
  const baseAvailableGenders = getAvailableGenders(pet.breed);
  // For torties on the landing page, only show female option
  const availableGenders = pet.breed === 'Tortie' 
    ? baseAvailableGenders.filter(gender => gender === 'female')
    : baseAvailableGenders;
  
  return (
    <Card 
      className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-pink-200" 
      onClick={() => onAdoptPet(pet)}
    >
      <CardHeader>
        <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br from-pink-100 to-purple-100">
          <img
            src={pet.image_url}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
        </div>
        <CardTitle className="text-pink-800">{pet.name}</CardTitle>
        <CardDescription className="capitalize">{pet.type}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-pink-800">Choose Gender</h4>
            <RadioGroup 
              value={selectedGender} 
              onValueChange={(value) => onGenderSelection(pet.id, value)}
              className="flex space-x-4"
              onClick={(e) => e.stopPropagation()}
            >
              {availableGenders.includes('male') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id={`${pet.id}-male`} />
                  <label htmlFor={`${pet.id}-male`} className="text-sm flex items-center">
                    Male
                  </label>
                </div>
              )}
              {availableGenders.includes('female') && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id={`${pet.id}-female`} />
                  <label htmlFor={`${pet.id}-female`} className="text-sm flex items-center">
                    Female
                  </label>
                </div>
              )}
            </RadioGroup>
          </div>
          
          <div className="bg-pink-50 p-3 rounded-lg text-center">
            <p className="text-pink-700 text-sm mb-2">
              Sign up to adopt this cutie!
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAdoptPet(pet);
              }}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              Adopt Me!
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LandingPetCard;
