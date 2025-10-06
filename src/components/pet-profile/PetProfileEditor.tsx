import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, X } from "lucide-react";

interface PetProfileEditorProps {
  pet: any;
  onUpdate: () => void;
}

const PetProfileEditor = ({ pet, onUpdate }: PetProfileEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [petName, setPetName] = useState(pet.pet_name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  console.log("PetProfileEditor rendered:", { 
    petId: pet.id, 
    petName: pet.pet_name, 
    isEditingName, 
    userId: user?.id 
  });

  const saveName = async () => {
    console.log("saveName called with:", petName.trim());
    
    if (!user || !petName.trim()) {
      toast({
        title: "Error",
        description: "Pet name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Validate pet name length
    if (petName.trim().length > 50) {
      toast({
        title: "Error",
        description: "Pet name must be 50 characters or less",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      console.log("Updating pet name for pet ID:", pet.id, "to:", petName.trim());
      
      const { error } = await supabase
        .from("user_pets")
        .update({ pet_name: petName.trim() })
        .eq("id", pet.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating pet name:", error);
        throw error;
      }

      console.log("Pet name updated successfully");
      toast({
        title: "Success!",
        description: "Pet name updated successfully",
      });
      setIsEditingName(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating pet name:", error);
      toast({
        title: "Error",
        description: "Failed to update pet name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelEdit = () => {
    console.log("cancelEdit called");
    setIsEditingName(false);
    setPetName(pet.pet_name || "");
  };

  const startEdit = (e: React.MouseEvent) => {
    console.log("startEdit called - entering edit mode", e);
    e.preventDefault();
    e.stopPropagation();
    setPetName(pet.pet_name || "");
    setIsEditingName(true);
  };

  if (isEditingName) {
    console.log("Rendering edit mode");
    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          className="flex-1"
          placeholder="Enter pet name"
          maxLength={50}
          disabled={isUpdating}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isUpdating) {
              e.preventDefault();
              saveName();
            }
            if (e.key === 'Escape' && !isUpdating) {
              e.preventDefault();
              cancelEdit();
            }
          }}
          autoFocus
        />
        <Button 
          onClick={saveName} 
          disabled={isUpdating || !petName.trim() || petName.trim() === pet.pet_name}
          size="sm"
          className="bg-pink-600 hover:bg-pink-700"
        >
          <Save className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={cancelEdit}
          disabled={isUpdating}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  console.log("Rendering display mode");
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-2xl font-bold text-pink-800">{pet.pet_name}</h2>
      <Badge variant="outline" className="text-xs">
        #{pet.pet_number || 1}
      </Badge>
      <button 
        onClick={startEdit}
        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
        title="Edit pet name"
        type="button"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PetProfileEditor;
