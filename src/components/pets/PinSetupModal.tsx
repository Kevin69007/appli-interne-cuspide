
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertTriangle } from "lucide-react";

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  petName: string;
  isLoading?: boolean;
}

const PinSetupModal = ({ isOpen, onClose, onConfirm, petName, isLoading = false }: PinSetupModalProps) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    setError("");
    
    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    
    // Check if PINs match
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    
    // Check for weak PINs
    if (pin === "0000" || pin === "1111" || pin === "2222" || pin === "3333" || 
        pin === "4444" || pin === "5555" || pin === "6666" || pin === "7777" ||
        pin === "8888" || pin === "9999" || pin === "1234" || pin === "4321") {
      setError("Please choose a stronger PIN (avoid repeated digits or sequences)");
      return;
    }
    
    onConfirm(pin);
  };

  const handleClose = () => {
    setPin("");
    setConfirmPin("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Lock className="w-5 h-5" />
            Lock {petName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-800">
                  Important Security Notice
                </p>
                <p className="text-sm text-amber-700">
                  Once locked, you'll need this PIN to sell or transfer this pet. 
                  Make sure to remember it - we cannot recover forgotten PINs.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="pin">Enter 4-digit PIN</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="****"
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
              onClick={handleConfirm} 
              disabled={!pin || !confirmPin || isLoading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Locking..." : "Lock Pet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinSetupModal;
