
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X } from "lucide-react";
import { usePetProfileActions } from "@/hooks/usePetProfileActions";

interface PetAboutSectionProps {
  pet: any;
  isOwnPet: boolean;
  onUpdate: () => void;
}

const PetAboutSection = ({ pet, isOwnPet, onUpdate }: PetAboutSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [aboutText, setAboutText] = useState(pet.about_section || "");
  const { updatePetAboutSection, loading } = usePetProfileActions();

  const handleSave = async () => {
    const success = await updatePetAboutSection(pet.id, aboutText);
    if (success) {
      setIsEditing(false);
      onUpdate();
    }
  };

  const handleCancel = () => {
    setAboutText(pet.about_section || "");
    setIsEditing(false);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-pink-800">About {pet.pet_name}</CardTitle>
          {isOwnPet && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Tell everyone about your pet..."
              className="min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[120px]">
            {pet.about_section ? (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {pet.about_section}
              </p>
            ) : (
              <p className="text-muted-foreground italic">
                {isOwnPet 
                  ? "Click Edit to add information about your pet..."
                  : "No description available for this pet."
                }
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PetAboutSection;
