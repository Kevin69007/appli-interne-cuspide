
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPetsData } from "@/hooks/useUserPetsData";
import PetImageDisplay from "@/components/shared/PetImageDisplay";

interface PetLinkButtonProps {
  onInsertPetLink: (petId: string) => void;
}

const PetLinkButton = ({ onInsertPetLink }: PetLinkButtonProps) => {
  const { user } = useAuth();
  const { userPets, loading } = useUserPetsData({ 
    targetUserId: user?.id,
    isOwnProfile: true 
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  const handleInsertPet = () => {
    if (selectedPetId) {
      onInsertPetLink(selectedPetId);
      setIsOpen(false);
      setSelectedPetId("");
    }
  };

  if (!user || loading) return null;

  return (
    <>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="h-8 px-2"
      >
        <Heart className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link a Pet</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
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

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInsertPet}
                disabled={!selectedPetId}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Insert Pet Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PetLinkButton;
