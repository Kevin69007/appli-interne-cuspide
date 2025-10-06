
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Unlock, AlertCircle } from "lucide-react";

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => void;
  petName: string;
  isLoading?: boolean;
  actionType?: 'unlock' | 'sell';
}

const PinVerificationModal = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  petName, 
  isLoading = false,
  actionType = 'unlock'
}: PinVerificationModalProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Use setTimeout to ensure the modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleVerify = () => {
    setError("");
    
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    
    onVerify(pin);
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleVerify();
    }
  };

  const getTitle = () => {
    switch (actionType) {
      case 'sell':
        return `Verify PIN to Sell ${petName}`;
      case 'unlock':
      default:
        return `Unlock ${petName}`;
    }
  };

  const getDescription = () => {
    switch (actionType) {
      case 'sell':
        return `Enter your PIN to authorize the sale of ${petName}`;
      case 'unlock':
      default:
        return `Enter your PIN to unlock ${petName}`;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Unlock className="w-5 h-5" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700">
                {getDescription()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Input
                ref={inputRef}
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                placeholder="Enter PIN"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleVerify} 
              disabled={pin.length !== 4 || isLoading}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinVerificationModal;
