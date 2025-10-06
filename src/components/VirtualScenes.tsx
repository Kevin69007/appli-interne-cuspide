import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Home, Eye } from "lucide-react";
import VirtualPet from "./VirtualPet";

interface UserPet {
  id: string;
  pet_name: string;
  hunger: number;
  friendliness: number;
  playfulness: number;
  energy: number;
  loyalty: number;
  curiosity: number;
  last_fed: string;
  last_played: string;
  last_cleaned: string;
  pets: {
    name: string;
    type: string;
  };
}

interface VirtualScene {
  id: string;
  name: string;
  description: string;
  background_url: string;
  scene_data: any;
  created_at: string;
}

const VirtualScenes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scenes, setScenes] = useState<VirtualScene[]>([]);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [selectedScene, setSelectedScene] = useState<VirtualScene | null>(null);
  const [selectedPet, setSelectedPet] = useState<UserPet | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newScene, setNewScene] = useState({ name: "", description: "", background_url: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchScenesAndPets();
    }
  }, [user]);

  const fetchScenesAndPets = async () => {
    if (!user) return;

    // Fetch user's scenes
    const { data: scenesData, error: scenesError } = await supabase
      .from("virtual_scenes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch user's pets - Updated query to exclude image_url
    const { data: petsData, error: petsError } = await supabase
      .from("user_pets")
      .select(`
        *,
        pets (name, type)
      `)
      .eq("user_id", user.id);

    if (scenesError) {
      console.error("Error fetching scenes:", scenesError);
    } else {
      setScenes(scenesData || []);
    }

    if (petsError) {
      console.error("Error fetching pets:", petsError);
    } else {
      // Map the data to match UserPet interface
      const mappedPets = (petsData || []).map(pet => ({
        ...pet,
        friendliness: pet.friendliness,
        playfulness: pet.playfulness,
        energy: pet.energy,
        loyalty: pet.loyalty,
        curiosity: pet.curiosity
      }));
      setUserPets(mappedPets);
      if (mappedPets && mappedPets.length > 0) {
        setSelectedPet(mappedPets[0]);
      }
    }

    setLoading(false);
  };

  const createScene = async () => {
    if (!user || !newScene.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a scene name",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("virtual_scenes")
      .insert({
        user_id: user.id,
        name: newScene.name.trim(),
        description: newScene.description.trim(),
        background_url: newScene.background_url.trim() || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        scene_data: {}
      });

    if (error) {
      console.error("Error creating scene:", error);
      toast({
        title: "Error",
        description: "Failed to create scene",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Scene created successfully",
      });
      setNewScene({ name: "", description: "", background_url: "" });
      setIsCreating(false);
      fetchScenesAndPets();
    }
  };

  const handlePetInteraction = async (action: string) => {
    if (!selectedPet || !user) return;

    let updateData: any = {};
    let hungerChange = 0;

    switch (action) {
      case "feed":
        hungerChange = 20;
        updateData.last_fed = new Date().toISOString();
        break;
      case "play":
        hungerChange = -10;
        updateData.last_played = new Date().toISOString();
        break;
      case "clean":
        hungerChange = -5;
        updateData.last_cleaned = new Date().toISOString();
        break;
    }

    const newHunger = Math.max(0, Math.min(100, selectedPet.hunger + hungerChange));
    updateData.hunger = newHunger;

    const { error } = await supabase
      .from("user_pets")
      .update(updateData)
      .eq("id", selectedPet.id);

    if (error) {
      console.error("Error updating pet:", error);
      toast({
        title: "Error",
        description: "Failed to interact with pet",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `${selectedPet.pet_name} enjoyed the ${action}!`,
      });
      fetchScenesAndPets();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading virtual scenes...</div>;
  }

  if (selectedScene) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedScene(null)}>
            ← Back to Scenes
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">{selectedScene.name}</h2>
            <p className="text-muted-foreground">{selectedScene.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scene Background */}
          <Card>
            <CardHeader>
              <CardTitle>Scene Environment</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="w-full h-64 rounded-lg bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${selectedScene.background_url})` }}
              >
                <div className="text-center text-white bg-black/30 rounded-lg p-4">
                  <Home className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">{selectedScene.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Virtual Pet Interaction */}
          {selectedPet ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Your Pet</h3>
                {userPets.length > 1 && (
                  <select 
                    value={selectedPet.id} 
                    onChange={(e) => {
                      const pet = userPets.find(p => p.id === e.target.value);
                      setSelectedPet(pet || null);
                    }}
                    className="px-3 py-1 border rounded-md"
                  >
                    {userPets.map(pet => (
                      <option key={pet.id} value={pet.id}>{pet.pet_name}</option>
                    ))}
                  </select>
                )}
              </div>
              <VirtualPet pet={selectedPet} onInteract={handlePetInteraction} />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">You need a pet to play in virtual scenes!</p>
                <Button onClick={() => window.location.href = "/play?tab=adopt"}>
                  Adopt a Pet
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Virtual Scenes</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Scene
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Scene</CardTitle>
            <CardDescription>Design a virtual environment for your pets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Scene name"
              value={newScene.name}
              onChange={(e) => setNewScene({ ...newScene, name: e.target.value })}
            />
            <Textarea
              placeholder="Scene description"
              value={newScene.description}
              onChange={(e) => setNewScene({ ...newScene, description: e.target.value })}
              rows={3}
            />
            <Input
              placeholder="Background image URL (optional)"
              value={newScene.background_url}
              onChange={(e) => setNewScene({ ...newScene, background_url: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={createScene}>Create Scene</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => (
          <Card key={scene.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div 
                className="w-full h-32 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(${scene.background_url})` }}
              />
              <CardTitle>{scene.name}</CardTitle>
              <CardDescription>{scene.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setSelectedScene(scene)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Enter Scene
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {scenes.length === 0 && !isCreating && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No virtual scenes yet</p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Scene
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VirtualScenes;
