
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSecurity } from "@/hooks/useSecurity";
import { validateUsername, sanitizeInput } from "@/utils/inputSecurity";

interface UsernameEditorProps {
  currentUsername: string;
  onUpdate: () => void;
}

const UsernameEditor = ({ currentUsername, onUpdate }: UsernameEditorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { secureApiCall, checkRateLimit } = useSecurity();
  const [username, setUsername] = useState(currentUsername || "");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;

    // Rate limiting check
    const rateLimitPassed = await checkRateLimit('PROFILE_UPDATE', 3);
    if (!rateLimitPassed) {
      return;
    }

    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: "Invalid Username",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    setLoading(true);

    try {
      await secureApiCall(
        async () => {
          // Check if username is already taken
          const { data: existingUser, error: checkError } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", validation.sanitizedValue)
            .neq("id", user.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw checkError;
          }

          if (existingUser) {
            throw new Error("Username is already taken");
          }

          // Update username
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ username: validation.sanitizedValue })
            .eq("id", user.id);

          if (updateError) throw updateError;

          toast({
            title: "Success!",
            description: "Username updated successfully",
          });
          onUpdate();
        },
        {
          requireAuth: true,
          checkOwnership: user.id,
          rateLimit: { action: 'PROFILE_UPDATE', limit: 3 },
          logAction: 'username_update_attempt'
        }
      );
    } catch (error: any) {
      console.error("Error updating username:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update username",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUsername || "");
    setValidationErrors([]);
    onUpdate();
  };

  const handleUsernameChange = (value: string) => {
    const sanitizedValue = sanitizeInput(value, 20);
    setUsername(sanitizedValue);
    
    // Clear validation errors if input becomes valid
    if (validationErrors.length > 0) {
      const validation = validateUsername(sanitizedValue);
      if (validation.isValid) {
        setValidationErrors([]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <Input
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          className={`flex-1 ${validationErrors.length > 0 ? 'border-red-500' : ''}`}
          maxLength={20}
          disabled={loading}
          placeholder="Enter new username"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading || !username.trim() || validationErrors.length > 0}
        >
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
      </div>
      
      {validationErrors.length > 0 && (
        <div className="text-sm text-red-600">
          {validationErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        {username.length}/20 characters • Letters, numbers, underscores, and hyphens only
      </div>
    </div>
  );
};

export default UsernameEditor;
