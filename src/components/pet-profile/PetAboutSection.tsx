
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X } from "lucide-react";
import { usePetProfileActions } from "@/hooks/usePetProfileActions";

interface PetAboutSectionProps {
  aboutSection?: string;
  petId: string;
  petName: string;
  isOwnProfile?: boolean;
  onUpdate?: () => void;
}

const PetAboutSection = ({ aboutSection, petId, petName, isOwnProfile = false, onUpdate }: PetAboutSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAboutSection, setEditedAboutSection] = useState(aboutSection || "");
  const { updatePetAboutSection } = usePetProfileActions();

  const handleSave = async () => {
    const success = await updatePetAboutSection(petId, editedAboutSection);
    if (success) {
      setIsEditing(false);
      onUpdate?.();
    }
  };

  const handleCancel = () => {
    setEditedAboutSection(aboutSection || "");
    setIsEditing(false);
  };

  if (!isOwnProfile) {
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-800">About {petName}</h4>
        <p className="text-gray-600 text-sm">
          {aboutSection || "No information available."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">About {petName}</h4>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-pink-600 hover:text-pink-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editedAboutSection}
            onChange={(e) => setEditedAboutSection(e.target.value)}
            placeholder={`Tell others about ${petName}...`}
            rows={3}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-sm">
          {aboutSection || `No information about ${petName} yet. Click edit to add some!`}
        </p>
      )}
    </div>
  );
};

export default PetAboutSection;
