import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Coins, Star, Zap, Save, X, Settings } from "lucide-react";
import XPLevelBadge from "./XPLevelBadge";
import PawClubBadge from "@/components/PawClubBadge";
import CareBadge from "./CareBadge";
import UsernameEditor from "./UsernameEditor";
import ProfileImageUpload from "./ProfileImageUpload";
import XPTooltip from "@/components/ui/XPTooltip";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  onProfileUpdate: () => void;
}

const ProfileHeader = ({ profile, isOwnProfile, onProfileUpdate }: ProfileHeaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [description, setDescription] = useState(profile?.profile_description_short || "");
  const [descriptionErrors, setDescriptionErrors] = useState<string[]>([]);

  const formatMemberSince = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSaveDescription = async () => {
    if (!user) return;

    // Basic validation
    if (description.length > 200) {
      setDescriptionErrors(["Description must be less than 200 characters"]);
      toast({
        title: "Validation Error",
        description: "Description is too long",
        variant: "destructive",
      });
      return;
    }

    setDescriptionErrors([]);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_description_short: description.trim() })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Description updated successfully",
      });
      setIsEditingDescription(false);
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };

  const handleCancelDescription = () => {
    setDescription(profile?.profile_description_short || "");
    setIsEditingDescription(false);
    setDescriptionErrors([]);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    // Clear errors if input becomes valid
    if (descriptionErrors.length > 0 && value.length <= 200) {
      setDescriptionErrors([]);
    }
  };

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 border border-pink-200 w-full">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <ProfileImageUpload
                userId={profile.id}
                currentImageUrl={profile.profile_image_url}
                onImageUpdate={onProfileUpdate}
                isOwnProfile={isOwnProfile}
              />
              
              <div className="flex flex-col items-center gap-1">
                <CareBadge careBadgeDays={profile.care_badge_days || 0} />
                {profile.pawclub_member && <PawClubBadge />}
              </div>
            </div>
            
            <div className="flex-1 w-full min-w-0">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {isEditingUsername && isOwnProfile ? (
                    <UsernameEditor
                      currentUsername={profile.username}
                      onUpdate={() => {
                        setIsEditingUsername(false);
                        onProfileUpdate();
                      }}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-pink-800 break-words">
                          {profile.username || "Unknown User"}
                        </h1>
                        <XPLevelBadge xp={profile.xp || 0} />
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          #{profile.profile_number}
                        </Badge>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2 mt-2 sm:mt-0 sm:ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingUsername(true)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSettingsOpen(true)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Member Since */}
                <div className="text-sm text-muted-foreground">
                  Member since {formatMemberSince(profile.created_at)}
                </div>

                {/* XP Display - Now visible for ALL users */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <XPTooltip xp={profile.xp || 0}>
                    <div className="flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-lg border border-pink-200 cursor-pointer">
                      <Zap className="w-4 h-4 text-pink-600" />
                      <span className="text-sm font-medium text-pink-800">
                        {profile.xp?.toLocaleString() || "0"} XP
                      </span>
                    </div>
                  </XPTooltip>
                  
                  {/* Paw Dollars and Paw Points - Only for own profile */}
                  {isOwnProfile && (
                    <>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          {profile.paw_dollars?.toLocaleString() || "0"} PD
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                        <Star className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          {profile.paw_points?.toLocaleString() || "0"} PP
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Description Section */}
                <div className="w-full">
                  {isEditingDescription && isOwnProfile ? (
                    <div className="space-y-2">
                      <Textarea
                        value={description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        className={`w-full p-2 border rounded-lg text-sm resize-none ${
                          descriptionErrors.length > 0 ? 'border-red-500' : 'border-gray-300'
                        }`}
                        rows={3}
                        maxLength={200}
                        placeholder="Add a short description about yourself..."
                      />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          description.length > 180 ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {description.length}/200
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveDescription}
                            disabled={descriptionErrors.length > 0}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelDescription}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {descriptionErrors.length > 0 && (
                        <div className="text-sm text-red-600">
                          {descriptionErrors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <p className="text-sm text-gray-600 flex-1 break-words">
                        {profile.profile_description_short || (isOwnProfile ? "Click to add a description..." : "")}
                      </p>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDescription(profile.profile_description_short || "");
                            setIsEditingDescription(true);
                          }}
                          className="p-1 h-auto flex-shrink-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onProfileUpdate={onProfileUpdate}
      />
    </>
  );
};

export default ProfileHeader;
