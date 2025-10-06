
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string) => void;
  isOwnProfile?: boolean;
}

const ProfileImageUpload = ({ userId, currentImageUrl, onImageUpdate, isOwnProfile = true }: ProfileImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }
      
      // Validate file size (5MB max)
      if (file.size > 5242880) {
        throw new Error('File size must be less than 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      // Delete old image if exists - extract filename from URL more carefully
      if (currentImageUrl) {
        try {
          // Extract filename from the full URL
          const urlParts = currentImageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // Only attempt to delete if the filename looks like it belongs to this user
          if (fileName && fileName.startsWith(userId)) {
            console.log('Attempting to delete old avatar:', fileName);
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([fileName]);
            
            if (deleteError) {
              console.warn('Could not delete old avatar:', deleteError);
              // Don't throw here, just continue with upload
            }
          }
        } catch (deleteError) {
          console.warn('Error deleting old avatar:', deleteError);
          // Continue with upload even if delete fails
        }
      }

      console.log('Uploading new avatar:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const imageUrl = data.publicUrl;
      console.log('New avatar URL:', imageUrl);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      onImageUpdate(imageUrl);
      
      toast({
        title: "Success!",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 border-4 border-pink-200">
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-pink-400" />
            </div>
          )}
        </div>
        
        {/* Only show upload button if this is the user's own profile */}
        {isOwnProfile && user?.id === userId && (
          <label className="absolute bottom-0 right-0 bg-pink-600 hover:bg-pink-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
            <Upload className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      
      {uploading && (
        <p className="text-sm text-pink-600">Uploading...</p>
      )}
    </div>
  );
};

export default ProfileImageUpload;
