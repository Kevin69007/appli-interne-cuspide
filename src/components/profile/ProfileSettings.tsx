
import { useState } from "react";
import { X, Eye, EyeOff, Trash2, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/utils/passwordValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProfileSettingsProps {
  profile: any;
  onProfileUpdate: () => void;
}

const ProfileSettings = ({ profile, onProfileUpdate }: ProfileSettingsProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  
  const [formData, setFormData] = useState({
    email: user?.email || "",
    username: profile?.username || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    feedingPrivacy: profile?.feeding_privacy || "user_only"
  });

  const handleUsernameUpdate = async () => {
    if (!user || !formData.username.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: formData.username.trim() })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Username updated successfully",
      });
      setEditingUsername(false);
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating username:", error);
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    if (!formData.newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePassword(formData.newPassword);
    if (!validation.isValid) {
      toast({
        title: "Password Requirements",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!formData.email || formData.email === user?.email) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email update initiated. Please check your new email for confirmation.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedingPrivacyChange = async (value: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ feeding_privacy: value })
        .eq("id", user?.id);

      if (error) throw error;

      setFormData(prev => ({ ...prev, feedingPrivacy: value }));
      onProfileUpdate();
      
      toast({
        title: "Success",
        description: "Feeding privacy updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleteLoading(true);
    try {
      // Delete the user's profile and all associated data
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Sign out the user
      await signOut();

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Username Settings */}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="flex gap-2">
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            disabled={loading || !editingUsername}
            readOnly={!editingUsername}
          />
          {editingUsername ? (
            <div className="flex gap-1">
              <Button 
                onClick={handleUsernameUpdate}
                disabled={loading || !formData.username.trim()}
                size="sm"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => {
                  setEditingUsername(false);
                  setFormData(prev => ({ ...prev, username: profile?.username || "" }));
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => setEditingUsername(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Email Settings */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            disabled={loading}
          />
          <Button 
            onClick={handleEmailChange}
            disabled={loading || formData.email === user?.email}
            size="sm"
          >
            Update
          </Button>
        </div>
      </div>

      {/* Password Settings */}
      <div className="space-y-4">
        <h3 className="font-medium">Change Password</h3>
        
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              disabled={loading}
              placeholder="At least 8 characters, 1 uppercase, 1 number"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            disabled={loading}
          />
        </div>
        
        <Button 
          onClick={handlePasswordChange}
          disabled={loading || !formData.newPassword || !formData.confirmPassword}
          className="w-full"
        >
          Update Password
        </Button>
      </div>

      {/* Feeding Privacy Settings */}
      <div className="space-y-2">
        <Label htmlFor="feedingPrivacy">Feeding Privacy</Label>
        <Select value={formData.feedingPrivacy} onValueChange={handleFeedingPrivacyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user_only">User Only</SelectItem>
            <SelectItem value="friends_only">Friends Only</SelectItem>
            <SelectItem value="everyone">Everyone</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Control who can see your pet feeding activities
        </p>
      </div>

      {/* Delete Account Section */}
      <div className="space-y-4 pt-4 border-t border-red-200">
        <h3 className="font-medium text-red-600">Danger Zone</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>⚠️ Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-semibold text-red-600">
                  This action cannot be undone. This will permanently delete:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All your pets and their data</li>
                  <li>All your breeding litters</li>
                  <li>Your Paw Points (PP) and Paw Dollars (PD)</li>
                  <li>Your profile information and messages</li>
                  <li>All account data and progress</li>
                </ul>
                <p className="font-semibold text-red-600 mt-4">
                  None of this data can be recovered after deletion.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProfileSettings;
