import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Utensils, Sparkles } from "lucide-react";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface VirtualPetProps {
  pet: {
    id: string;
    pet_name: string;
    breed?: string;
    hunger: number;
    friendliness: number;
    playfulness: number;
    energy: number;
    loyalty: number;
    curiosity: number;
    pets: {
      name: string;
      type: string;
    };
  };
  onInteract: (action: string) => void;
}

const VirtualPet = ({ pet, onInteract }: VirtualPetProps) => {
  const [animation, setAnimation] = useState("");
  const [mood, setMood] = useState("neutral");

  useEffect(() => {
    // Determine pet mood based on hunger
    if (pet.hunger < 30) {
      setMood("sad");
    } else if (pet.hunger > 80) {
      setMood("happy");
    } else {
      setMood("neutral");
    }
  }, [pet.hunger]);

  const handleFeed = () => {
    setAnimation("eating");
    onInteract("feed");
    setTimeout(() => setAnimation(""), 2000);
  };

  const handlePlay = () => {
    setAnimation("playing");
    onInteract("play");
    setTimeout(() => setAnimation(""), 2000);
  };

  const handleClean = () => {
    setAnimation("cleaning");
    onInteract("clean");
    setTimeout(() => setAnimation(""), 2000);
  };

  const getPetStyle = () => {
    let baseStyle = "w-32 h-32 mx-auto rounded-full transition-all duration-500 ";
    
    if (animation === "eating") {
      baseStyle += "scale-110 ";
    } else if (animation === "playing") {
      baseStyle += "animate-bounce ";
    } else if (animation === "cleaning") {
      baseStyle += "animate-pulse ";
    }

    if (mood === "happy") {
      baseStyle += "filter brightness-110 ";
    } else if (mood === "sad") {
      baseStyle += "filter brightness-75 grayscale-25 ";
    }

    return baseStyle;
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{pet.pet_name}</CardTitle>
        <p className="text-sm text-muted-foreground capitalize">{pet.pets.type}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Virtual Pet Display */}
        <div className="relative bg-white/50 rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center">
          <div className="w-32 h-32 mx-auto rounded-full transition-all duration-500">
            <PetImageDisplay
              pet={pet}
              className={getPetStyle()}
            />
          </div>
          
          {/* Mood indicator */}
          <div className="mt-4 flex justify-center">
            {mood === "happy" && <span className="text-2xl">😊</span>}
            {mood === "neutral" && <span className="text-2xl">😐</span>}
            {mood === "sad" && <span className="text-2xl">😢</span>}
          </div>

          {/* Animation effects */}
          {animation === "eating" && (
            <div className="absolute top-2 right-2 text-2xl animate-bounce">🍖</div>
          )}
          {animation === "playing" && (
            <div className="absolute top-2 left-2 text-2xl animate-spin">⚽</div>
          )}
          {animation === "cleaning" && (
            <div className="absolute top-2 right-2 text-2xl animate-pulse">✨</div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Hunger</span>
            <span className={pet.hunger < 30 ? 'text-red-500' : pet.hunger > 80 ? 'text-green-500' : 'text-yellow-500'}>
              {pet.hunger}%
            </span>
          </div>
          <Progress value={pet.hunger} className="h-2" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={handleFeed} 
            disabled={animation !== ""}
            size="sm"
            className="flex flex-col items-center p-2 h-auto"
          >
            <Utensils className="w-4 h-4 mb-1" />
            Feed
          </Button>
          <Button 
            onClick={handlePlay} 
            disabled={animation !== ""}
            size="sm"
            variant="outline"
            className="flex flex-col items-center p-2 h-auto"
          >
            <Heart className="w-4 h-4 mb-1" />
            Play
          </Button>
          <Button 
            onClick={handleClean} 
            disabled={animation !== ""}
            size="sm"
            variant="outline"
            className="flex flex-col items-center p-2 h-auto"
          >
            <Sparkles className="w-4 h-4 mb-1" />
            Clean
          </Button>
        </div>

        {/* Pet Stats Display */}
        <div className="text-xs space-y-1 bg-white/30 rounded p-2">
          <div className="grid grid-cols-2 gap-1">
            <span>Friendliness: {pet.friendliness}</span>
            <span>Playfulness: {pet.playfulness}</span>
            <span>Energy: {pet.energy}</span>
            <span>Loyalty: {pet.loyalty}</span>
            <span className="col-span-2 text-center">Curiosity: {pet.curiosity}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VirtualPet;
