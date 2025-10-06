
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X } from "lucide-react";

interface ShortDescriptionEditorProps {
  currentDescription: string;
  onUpdate: () => void;
}

const ShortDescriptionEditor = ({ currentDescription, onUpdate }: ShortDescriptionEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(currentDescription || "");

  const saveDescription = async () => {
    if (!user) return;

    if (description.length > 100) {
      toast({
        title: "Description too long",
        description: "Description must be 100 characters or less",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_description_short: description })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Short description updated successfully",
      });
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating short description:", error);
      toast({
        title: "Error",
        description: "Failed to update short description",
        variant: "destructive",
      });
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a short description (max 100 chars)..."
          maxLength={100}
          className="text-sm"
        />
        <span className="text-xs text-muted-foreground">{description.length}/100</span>
        <Button onClick={saveDescription} size="sm" variant="ghost">
          <Save className="w-3 h-3" />
        </Button>
        <Button 
          onClick={() => {
            setEditing(false);
            setDescription(currentDescription || "");
          }} 
          size="sm" 
          variant="ghost"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <p className="text-sm text-muted-foreground italic">
        {currentDescription || "Add a short description..."}
      </p>
      <Button onClick={() => setEditing(true)} size="sm" variant="ghost">
        <Edit className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default ShortDescriptionEditor;
