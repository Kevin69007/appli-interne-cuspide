
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import UsernameInput from "./UsernameInput";

interface PrivateSaleToggleProps {
  isPrivate: boolean;
  onPrivateChange: (isPrivate: boolean) => void;
  targetUsername: string;
  onTargetUsernameChange: (username: string) => void;
  disabled?: boolean;
}

const PrivateSaleToggle = ({
  isPrivate,
  onPrivateChange,
  targetUsername,
  onTargetUsernameChange,
  disabled = false
}: PrivateSaleToggleProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Switch
          id="private-sale"
          checked={isPrivate}
          onCheckedChange={onPrivateChange}
          disabled={disabled}
        />
        <Label htmlFor="private-sale" className="text-sm">
          Sell to specific user only
        </Label>
      </div>
      
      {isPrivate && (
        <div className="pl-6 border-l-2 border-blue-200">
          <UsernameInput
            value={targetUsername}
            onChange={onTargetUsernameChange}
            label="Username"
            placeholder="Enter the buyer's username"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Only this user will be able to see and purchase this pet
          </p>
        </div>
      )}
    </div>
  );
};

export default PrivateSaleToggle;
