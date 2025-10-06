
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X } from "lucide-react";
import RichTextEditor from "@/components/forum/RichTextEditor";
import FormattedText from "@/components/forum/FormattedText";

interface UserAboutSectionProps {
  profile: any;
  isOwnProfile: boolean;
  onUpdate: () => void;
}

const UserAboutSection = ({ profile, isOwnProfile, onUpdate }: UserAboutSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(profile?.profile_description || "");

  // Update local state when profile changes
  useEffect(() => {
    setDescription(profile?.profile_description || "");
  }, [profile?.profile_description]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_description: description })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "About section updated",
        description: "Your about section has been saved successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating about section:", error);
      toast({
        title: "Error",
        description: "Failed to update about section",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setDescription(profile?.profile_description || "");
    setIsEditing(false);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-pink-800">About Me</CardTitle>
        {isOwnProfile && (
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
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Tell others about yourself..."
            rows={6}
          />
        ) : (
          <div className="text-gray-700">
            {profile?.profile_description ? (
              <FormattedText content={profile.profile_description} />
            ) : (
              <div className="text-muted-foreground italic">
                {isOwnProfile ? "Click edit to add information about yourself." : "No information available."}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAboutSection;
