
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Coins } from "lucide-react";
import { recordGiftTransaction } from "@/utils/transactionUtils";

interface GiftPawDollarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientUsername: string;
  onSuccess?: () => void;
}

const GiftPawDollarsModal = ({
  isOpen,
  onClose,
  recipientId,
  recipientUsername,
  onSuccess
}: GiftPawDollarsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!user || !amount) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount to gift",
        variant: "destructive",
      });
      return;
    }

    const giftAmount = parseInt(amount);
    if (isNaN(giftAmount) || giftAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to gift",
        variant: "destructive",
      });
      return;
    }

    if (giftAmount > 10000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum gift amount is 10,000 Paw Dollars",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      console.log(`🎁 Starting gift transaction: ${giftAmount} PD from ${user.id} to ${recipientId}`);
      
      // Get sender and recipient profiles for usernames and validation
      const [senderProfile, recipientProfile] = await Promise.all([
        supabase.from("profiles").select("username, paw_dollars").eq("id", user.id).single(),
        supabase.from("profiles").select("username, paw_dollars").eq("id", recipientId).single()
      ]);

      if (senderProfile.error) {
        console.error("❌ Error fetching sender profile:", senderProfile.error);
        throw new Error("Could not verify sender profile");
      }
      
      if (recipientProfile.error) {
        console.error("❌ Error fetching recipient profile:", recipientProfile.error);
        throw new Error("Could not verify recipient profile");
      }

      // Check sender has enough funds
      if (senderProfile.data.paw_dollars < giftAmount) {
        throw new Error("Insufficient funds");
      }

      console.log(`💰 Sender balance: ${senderProfile.data.paw_dollars} PD, sending: ${giftAmount} PD`);
      console.log(`💰 Recipient balance: ${recipientProfile.data.paw_dollars} PD`);

      // Use the transfer-paw-dollars edge function for atomic transaction
      const { data: transferResult, error: transferError } = await supabase.functions.invoke('transfer-paw-dollars', {
        body: {
          sender_id: user.id,
          recipient_id: recipientId,
          amount: giftAmount
        }
      });

      if (transferError) {
        console.error("❌ Edge function error:", transferError);
        throw new Error(`Transfer failed: ${transferError.message}`);
      }

      if (!transferResult?.success) {
        console.error("❌ Transfer result failed:", transferResult);
        throw new Error(transferResult?.error || "Transfer failed");
      }

      console.log(`✅ Transfer completed successfully via edge function`);

      // Record gift transactions for both users in the ledger
      await recordGiftTransaction(
        user.id,
        recipientId,
        giftAmount,
        senderProfile.data.username || 'Unknown',
        recipientUsername
      );

      console.log(`📝 Gift transactions recorded in ledger`);

      toast({
        title: "Gift Sent! 🎁",
        description: `Successfully sent ${giftAmount} Paw Dollars to ${recipientUsername}!`,
      });

      setAmount("");
      onClose();
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error("❌ Error sending gift:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to send gift. Please try again.";
      
      if (error.message?.includes("Insufficient funds")) {
        errorMessage = "You don't have enough Paw Dollars to send this gift.";
      } else if (error.message?.includes("Transfer failed")) {
        errorMessage = "Transfer failed. Please check your connection and try again.";
      } else if (error.message?.includes("verify")) {
        errorMessage = "Could not verify user profiles. Please try again.";
      }
      
      toast({
        title: "Gift Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Send Paw Dollars
          </DialogTitle>
          <DialogDescription>
            Send Paw Dollars to {recipientUsername}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (Paw Dollars)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="10000"
              disabled={sending}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleClose} variant="outline" className="flex-1" disabled={sending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={sending || !amount || parseInt(amount) <= 0}
              className="flex-1"
            >
              {sending ? "Sending..." : `Send ${amount || "0"} PD`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftPawDollarsModal;
