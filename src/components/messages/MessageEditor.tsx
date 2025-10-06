
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X } from "lucide-react";

interface MessageEditorProps {
  profile: any;
  onUpdate: () => void;
}

const MessageEditor = ({ profile, onUpdate }: MessageEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(profile?.profile_description || "");

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_description: description })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Description updated",
        description: "Your description has been saved successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setDescription(profile?.profile_description || "");
    setIsEditing(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">My Description</CardTitle>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm" variant="default">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description about yourself that others will see when they visit your profile..."
            rows={4}
            className="w-full"
          />
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap">
            {profile?.profile_description || "Click edit to add a description about yourself."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageEditor;
