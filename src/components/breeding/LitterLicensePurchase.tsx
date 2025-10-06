
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Minus, Plus } from "lucide-react";
import { recordTransaction } from "@/utils/transactionUtils";

interface LitterLicensePurchaseProps {
  onUpdate: () => void;
  userLicenseCount: number;
}

const LitterLicensePurchase = ({ onUpdate, userLicenseCount }: LitterLicensePurchaseProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const LICENSE_PRICE = 100; // 100 paw dollars per license
  const totalCost = quantity * LICENSE_PRICE;

  const handlePurchase = async () => {
    if (!user) return;

    setIsPurchasing(true);
    try {
      // Check user's balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("paw_dollars")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.paw_dollars < totalCost) {
        toast({
          title: "Insufficient Funds",
          description: `You need ${totalCost} paw dollars but only have ${profile.paw_dollars}`,
          variant: "destructive",
        });
        return;
      }

      // Update user balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ paw_dollars: profile.paw_dollars - totalCost })
        .eq("id", user.id);

      if (balanceError) throw balanceError;

      // Create licenses
      const licenses = Array.from({ length: quantity }, () => ({
        user_id: user.id,
        used: false,
      }));

      const { error: insertError } = await supabase
        .from("litter_licenses")
        .insert(licenses);

      if (insertError) throw insertError;

      // Record transaction using transactionUtils
      await recordTransaction({
        userId: user.id,
        pawDollars: -totalCost,
        description: `Purchased ${quantity} litter license${quantity > 1 ? 's' : ''}`,
        transactionType: "purchase"
      });

      toast({
        title: "Purchase Successful! 🎉",
        description: `You bought ${quantity} litter license${quantity > 1 ? 's' : ''} for ${totalCost} paw dollars`,
      });

      setQuantity(1);
      onUpdate();
    } catch (error: any) {
      console.error("Error purchasing licenses:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase litter licenses",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Purchase Section */}
      <Card className="bg-white/90 backdrop-blur-sm border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Purchase Litter Licenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>You currently have <span className="font-semibold text-pink-600">{userLicenseCount}</span> unused litter licenses.</p>
            <p className="mt-1">Each license costs <span className="font-semibold">100 paw dollars</span>.</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-pink-800">
                Total Cost: {totalCost} paw dollars
              </p>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {isPurchasing ? "Purchasing..." : `Purchase ${quantity} License${quantity > 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LitterLicensePurchase;
