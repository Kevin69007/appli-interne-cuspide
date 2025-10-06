
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Search } from "lucide-react";

interface UsernameInputProps {
  value: string;
  onChange: (username: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const UsernameInput = ({ 
  value, 
  onChange, 
  label = "Target Username", 
  placeholder = "Enter username...",
  disabled = false 
}: UsernameInputProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'none'>('none');
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!value.trim()) {
      setValidationStatus('none');
      setValidationMessage("");
      return;
    }

    const validateUsername = async () => {
      setIsValidating(true);
      try {
        // Use case-insensitive search with ILIKE
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .ilike("username", value.trim())
          .single();

        if (error || !data) {
          setValidationStatus('invalid');
          setValidationMessage("User not found");
        } else {
          setValidationStatus('valid');
          setValidationMessage(`User found: ${data.username}`);
          // Update the input value to match the exact case from database
          if (data.username.toLowerCase() === value.trim().toLowerCase() && data.username !== value.trim()) {
            onChange(data.username);
          }
        }
      } catch (error) {
        setValidationStatus('invalid');
        setValidationMessage("Error validating username");
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [value, onChange]);

  return (
    <div className="space-y-1">
      <Label htmlFor="username-input" className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          id="username-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`text-xs h-8 pr-8 ${
            validationStatus === 'valid' ? 'border-green-500' : 
            validationStatus === 'invalid' ? 'border-red-500' : ''
          }`}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {isValidating && <Search className="w-3 h-3 animate-spin text-gray-400" />}
          {!isValidating && validationStatus === 'valid' && <Check className="w-3 h-3 text-green-500" />}
          {!isValidating && validationStatus === 'invalid' && <X className="w-3 h-3 text-red-500" />}
        </div>
      </div>
      {validationMessage && (
        <p className={`text-xs ${validationStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
          {validationMessage}
        </p>
      )}
    </div>
  );
};

export default UsernameInput;
