
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key } from "lucide-react";
import { logInvalidInput } from "@/utils/securityLogger";

interface AlphaKeyFormProps {
  onValidKey: () => void;
}

interface AlphaKeyResponse {
  valid: boolean;
  message?: string;
  error?: string;
}

const AlphaKeyForm = ({ onValidKey }: AlphaKeyFormProps) => {
  const [alphaKey, setAlphaKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateAlphaKey = async () => {
    if (!alphaKey.trim()) {
      logInvalidInput('alpha_key', '', undefined);
      toast({
        title: "Invalid input",
        description: "Please enter an alpha key",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    
    try {
      const { data, error } = await supabase.rpc('validate_alpha_key', {
        key_input: alphaKey.trim()
      });

      if (error) {
        console.error('Alpha key validation error:', error);
        toast({
          title: "Validation failed",
          description: "Unable to validate alpha key. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Safe type casting - first convert to unknown, then to our interface
      const response = data as unknown as AlphaKeyResponse;

      if (response?.valid) {
        toast({
          title: "Alpha key accepted!",
          description: response.message || "You can now proceed with signup",
        });
        onValidKey();
      } else {
        logInvalidInput('alpha_key', alphaKey.substring(0, 10), undefined);
        toast({
          title: "Invalid alpha key",
          description: response?.error || "Please enter a valid alpha key to continue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error during alpha key validation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Key className="w-5 h-5 text-yellow-600" />
          Alpha Access Required
        </CardTitle>
        <CardDescription>
          This is a beta version. Please enter your alpha key to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="alphaKey">Alpha Key</Label>
          <Input
            id="alphaKey"
            type="text"
            placeholder="Enter your alpha key"
            value={alphaKey}
            onChange={(e) => setAlphaKey(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !isValidating && validateAlphaKey()}
            maxLength={20}
          />
        </div>
        <Button 
          onClick={validateAlphaKey}
          disabled={!alphaKey.trim() || isValidating}
          className="w-full"
        >
          {isValidating ? "Validating..." : "Validate Key"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlphaKeyForm;
