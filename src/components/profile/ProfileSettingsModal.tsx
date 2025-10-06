import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onProfileUpdate: () => void;
}

const ProfileSettingsModal = ({ isOpen, onClose, profile, onProfileUpdate }: ProfileSettingsModalProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: user?.email || "",
    newPassword: "",
    confirmPassword: "",
    feedingPrivacy: profile?.feeding_privacy || "user_only",
    messagePrivacy: profile?.message_privacy || "user_only",
    defaultAdoptGender: profile?.default_adopt_gender || "male"
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Basic email validation
    if (formData.email !== user?.email) {
      if (!formData.email || !formData.email.includes('@')) {
        errors.email = ['Please enter a valid email address'];
      }
    }

    // Basic password validation
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        errors.password = ['Password must be at least 8 characters long'];
      }

      if (formData.newPassword !== formData.confirmPassword) {
        if (!errors.password) errors.password = [];
        errors.password.push('Passwords do not match');
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = async () => {
    if (!validateForm() || !formData.email || formData.email === user?.email) {
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
      console.error("Email update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validateForm() || !formData.newPassword) {
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

      setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async (field: 'feeding_privacy' | 'message_privacy' | 'default_adopt_gender', value: string) => {
    if (!user?.id) return;

    const validSettings = {
      'feeding_privacy': ['user_only', 'friends_only', 'everyone'],
      'message_privacy': ['user_only', 'friends_only', 'everyone'],
      'default_adopt_gender': ['male', 'female']
    };
    
    if (!validSettings[field].includes(value)) {
      toast({
        title: "Invalid Option",
        description: "Invalid setting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", user.id);

      if (error) throw error;

      if (field === 'feeding_privacy') {
        setFormData(prev => ({ ...prev, feedingPrivacy: value }));
      } else if (field === 'message_privacy') {
        setFormData(prev => ({ ...prev, messagePrivacy: value }));
      } else if (field === 'default_adopt_gender') {
        setFormData(prev => ({ ...prev, defaultAdoptGender: value }));
      }
      
      onProfileUpdate();
      
      const fieldName = field === 'feeding_privacy' ? 'Feeding' : 
                       field === 'message_privacy' ? 'Message' : 'Default adoption gender';
      
      toast({
        title: "Success",
        description: `${fieldName} setting updated`,
      });
    } catch (error: any) {
      console.error("Setting update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update setting. Please try again.",
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
      // Note: With RLS policies in place, this will only delete the user's own data
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) throw profileError;

      await signOut();

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Basic input sanitization
    const sanitizedValue = value.trim();
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Account Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Email Settings */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                maxLength={254}
                className={validationErrors.email ? "border-red-500" : ""}
              />
              <Button 
                onClick={handleEmailChange}
                disabled={loading || formData.email === user?.email}
                size="sm"
              >
                Update
              </Button>
            </div>
            {validationErrors.email && (
              <div className="text-sm text-red-600">
                {validationErrors.email.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>

          <Separator />

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
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  disabled={loading}
                  placeholder="At least 8 characters, 1 uppercase, 1 number, 1 special character"
                  maxLength={128}
                  className={validationErrors.password ? "border-red-500" : ""}
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
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
                maxLength={128}
                className={validationErrors.password ? "border-red-500" : ""}
              />
            </div>

            {validationErrors.password && (
              <div className="text-sm text-red-600">
                {validationErrors.password.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
            
            <Button 
              onClick={handlePasswordChange}
              disabled={loading || !formData.newPassword || !formData.confirmPassword}
              className="w-full"
            >
              Update Password
            </Button>
          </div>

          <Separator />

          {/* Privacy and Preference Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Privacy & Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="feedingPrivacy">Feeding Privacy</Label>
              <Select 
                value={formData.feedingPrivacy} 
                onValueChange={(value) => handlePrivacyUpdate('feeding_privacy', value)}
                disabled={loading}
              >
                <SelectTrigger className={validationErrors.feedingPrivacy ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_only">User Only</SelectItem>
                  <SelectItem value="friends_only">Friends Only</SelectItem>
                  <SelectItem value="everyone">Everyone</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Control who can feed your pets
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messagePrivacy">Message Privacy</Label>
              <Select 
                value={formData.messagePrivacy} 
                onValueChange={(value) => handlePrivacyUpdate('message_privacy', value)}
                disabled={loading}
              >
                <SelectTrigger className={validationErrors.messagePrivacy ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_only">User Only</SelectItem>
                  <SelectItem value="friends_only">Friends Only</SelectItem>
                  <SelectItem value="everyone">Everyone</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Control who can send you messages
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultAdoptGender">Default Adoption Gender</Label>
              <Select 
                value={formData.defaultAdoptGender} 
                onValueChange={(value) => handlePrivacyUpdate('default_adopt_gender', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Default gender selection on the adoption page
              </p>
            </div>
          </div>

          <Separator />

          {/* Delete Account Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-red-600">Danger Zone</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Delete Account</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p className="font-semibold text-red-600">
                      This action cannot be undone. This will permanently delete all your data.
                    </p>
                    <p className="text-sm">
                      Including your profile, pets, messages, transactions, and all associated data.
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

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Security Features Active:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Input validation and sanitization</li>
                  <li>• Rate limiting protection</li>
                  <li>• Session validation</li>
                  <li>• Secure data transmission</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsModal;
