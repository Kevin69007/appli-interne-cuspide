
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit, X, Heart } from "lucide-react";
import { getBreedStatConfig } from "@/utils/breedStatConfig";
import { renderStatBar } from "@/utils/statBarUtils";

interface BabyProfileModalProps {
  baby: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const BabyProfileModal = ({ baby, isOpen, onClose, onUpdate }: BabyProfileModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [babyDescription, setBabyDescription] = useState(baby.description || "");
  const [babyName, setBabyName] = useState(baby.pet_name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [parents, setParents] = useState<{ parent1: any; parent2: any } | null>(null);

  // Check if current user owns this baby (can edit if it's in their breeding pair)
  const canEdit = user && baby.breeding_pair_id; // For now, assume they can edit if they have a breeding pair id

  useEffect(() => {
    if (baby.breeding_pair_id && isOpen) {
      fetchParents();
    }
  }, [baby.breeding_pair_id, isOpen]);

  const fetchParents = async () => {
    try {
      const { data: breedingPair, error } = await supabase
        .from("breeding_pairs")
        .select(`
          parent1_id,
          parent2_id,
          parent1:user_pets!parent1_id (
            pet_name,
            breed
          ),
          parent2:user_pets!parent2_id (
            pet_name,
            breed
          )
        `)
        .eq("id", baby.breeding_pair_id)
        .single();

      if (error) {
        console.error("Error fetching parents:", error);
        return;
      }

      if (breedingPair) {
        setParents({
          parent1: breedingPair.parent1,
          parent2: breedingPair.parent2
        });
      }
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const saveDescription = async () => {
    if (!user || !canEdit) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("litter_babies")
        .update({ description: babyDescription })
        .eq("id", baby.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Baby description updated successfully",
      });
      setEditingDescription(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating baby description:", error);
      toast({
        title: "Error",
        description: "Failed to update baby description",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  const saveName = async () => {
    if (!user || !canEdit || !babyName.trim()) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("litter_babies")
        .update({ pet_name: babyName.trim() })
        .eq("id", baby.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Baby name updated successfully",
      });
      setEditingName(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating baby name:", error);
      toast({
        title: "Error",
        description: "Failed to update baby name",
        variant: "destructive",
      });
    }
    setIsUpdating(false);
  };

  // Capitalize baby name properly
  const capitalizedBabyName = (editingName ? babyName : baby.pet_name)
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Get breed-specific image - updated with new images
  const getBreedImage = (breed: string) => {
    const breedImages: { [key: string]: string } = {
      'german shepherd': '/lovable-uploads/21ce7e7c-282c-4c83-ab6a-c701a7197077.png',
      'golden retriever': '/lovable-uploads/f90c9dbf-2cd5-4c96-ad2f-4e2fcf9c8ea8.png',
      'husky': '/lovable-uploads/ca24ff23-a1c6-4913-90e0-83f85212dcb2.png',
      'yellow lab': '/lovable-uploads/6cee5c22-dcd5-4727-8e35-8445ed6364e8.png',
      'chihuahua': '/lovable-uploads/0ea8e7b2-2c1c-4b3b-beb1-b47027536d35.png',
      'dalmatian': '/lovable-uploads/526b5e41-8093-4dcc-b5dc-d71759bbbda5.png',
      'black cat': '/lovable-uploads/1e202ef9-ddac-4379-b292-a45057e2505e.png',
      'orange cat': '/lovable-uploads/db2f35ce-1472-44ca-9166-ba693a2e3008.png',
      'persian': '/lovable-uploads/2bdde684-a5ff-46df-bf3f-8cf29aeca7c7.png',
      'tuxedo cat': '/lovable-uploads/9f857369-8543-4245-9a5a-d01f8ea4922d.png'
    };
    
    const normalizedBreed = breed.toLowerCase();
    return breedImages[normalizedBreed] || '/placeholder.svg';
  };

  const breedConfig = getBreedStatConfig(baby.breed || "");
  
  const getStatColor = (value: number) => {
    if (value < 0) return "text-red-600";
    if (value >= 67) return "text-green-600";
    return "text-gray-600";
  };

  const stats = [
    { name: "Friendliness", value: baby.friendliness, statType: 'friendliness' as const },
    { name: "Playfulness", value: baby.playfulness, statType: 'playfulness' as const },
    { name: "Energy", value: baby.energy, statType: 'energy' as const },
    { name: "Loyalty", value: baby.loyalty, statType: 'loyalty' as const },
    { name: "Curiosity", value: baby.curiosity, statType: 'curiosity' as const },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pink-800 flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  className="flex-1"
                  placeholder="Enter baby's name"
                />
                <Button 
                  onClick={saveName} 
                  disabled={isUpdating || !babyName.trim()}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingName(false);
                    setBabyName(baby.pet_name || "");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                {capitalizedBabyName}'s Profile
                {canEdit && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingName(true)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">About Me</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="mt-4 space-y-4">
            {/* Baby Image and Basic Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-pink-200">
                <img
                  src={getBreedImage(baby.breed || "")}
                  alt={capitalizedBabyName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {capitalizedBabyName}
                </h3>
                <p className="text-sm text-gray-600 capitalize mb-1">
                  {baby.breed} • {baby.gender}
                </p>
                {baby.birthday && (
                  <p className="text-xs text-gray-500">
                    Born: {new Date(baby.birthday).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Parent Information */}
            {parents && (parents.parent1 || parents.parent2) && (
              <Card className="bg-pink-50 border-pink-200">
                <CardHeader>
                  <CardTitle className="text-pink-800 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Parents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {parents.parent1 && (
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold text-pink-600">
                          ♀
                        </div>
                        <div>
                          <p className="font-medium text-sm">{parents.parent1.pet_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{parents.parent1.breed}</p>
                        </div>
                      </div>
                    )}
                    {parents.parent2 && (
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-600">
                          ♂
                        </div>
                        <div>
                          <p className="font-medium text-sm">{parents.parent2.pet_name}</p>
                          <p className="text-xs text-gray-500 capitalize">{parents.parent2.breed}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description Section */}
            <Card className="bg-white/90 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-pink-800">About {capitalizedBabyName}</CardTitle>
                  {canEdit && !editingDescription && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingDescription(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingDescription ? (
                  <div className="space-y-4">
                    <Textarea
                      value={babyDescription}
                      onChange={(e) => setBabyDescription(e.target.value)}
                      placeholder="Tell others about your baby pet..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={saveDescription} 
                        disabled={isUpdating}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setEditingDescription(false);
                        setBabyDescription(baby.description || "");
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {baby.description || "No description yet. Click edit to add one!"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
              <CardContent className="p-6 space-y-6">
                {stats.map((stat, index) => {
                  const config = breedConfig[stat.statType];
                  return (
                    <div key={index}>
                      {renderStatBar({
                        label: stat.name,
                        value: stat.value,
                        min: config.min,
                        max: config.max,
                        getStatColor,
                        compact: false
                      })}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BabyProfileModal;
