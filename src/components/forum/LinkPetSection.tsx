
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPetsData } from "@/hooks/useUserPetsData";
import PetImageDisplay from "@/components/shared/PetImageDisplay";
import PetProfileModal from "@/components/pets/PetProfileModal";

const LinkPetSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userPets, loading } = useUserPetsData({ 
    targetUserId: user?.id,
    isOwnProfile: true 
  });
  
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const selectedPet = userPets.find(pet => pet.id === selectedPetId);
  const profileUrl = selectedPet ? `${window.location.origin}/pet-profile/${selectedPet.id}` : "";
  const embedCode = selectedPet ? `[pet-profile]${selectedPet.id}[/pet-profile]` : "";

  const handleCopy = async (text: string, fieldName: string) => {
    if (!text) {
      toast({
        title: "No pet selected",
        description: "Please select a pet first",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      console.log('📋 LinkPetSection - copied to clipboard:', fieldName);
      toast({
        title: "Copied!",
        description: `${fieldName} copied to clipboard`,
      });
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('❌ LinkPetSection - copy failed:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800">Link a Pet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded mb-4"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800">Link a Pet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pet-select">Select Pet</Label>
            <Select value={selectedPetId} onValueChange={setSelectedPetId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pet to link..." />
              </SelectTrigger>
              <SelectContent>
                {userPets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded overflow-hidden">
                        <PetImageDisplay
                          pet={{
                            pet_name: pet.pet_name,
                            breed: pet.breed,
                            pets: pet.pets
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{pet.pet_name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({pet.breed || pet.pets?.name})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPet && (
            <>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <PetImageDisplay
                      pet={{
                        pet_name: selectedPet.pet_name,
                        breed: selectedPet.breed,
                        pets: selectedPet.pets
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-pink-800">{selectedPet.pet_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPet.breed || selectedPet.pets?.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View Profile
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="profile-url">Profile Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="profile-url"
                    value={profileUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(profileUrl, "Profile Link")}
                    variant="outline"
                  >
                    {copiedField === "Profile Link" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="embed-code">Forum Embed Code</Label>
                <div className="flex gap-2 mt-1">
                  <Textarea
                    id="embed-code"
                    value={embedCode}
                    readOnly
                    className="flex-1 min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(embedCode, "Embed Code")}
                    variant="outline"
                    className="self-start"
                  >
                    {copiedField === "Embed Code" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste this code in forum posts to embed the pet profile
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedPet && (
        <PetProfileModal
          pet={selectedPet}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          isOwnProfile={true}
        />
      )}
    </>
  );
};

export default LinkPetSection;
