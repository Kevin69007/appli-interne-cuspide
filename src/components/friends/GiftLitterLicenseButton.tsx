import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GiftLitterLicenseButtonProps {
  friendId: string;
  friendUsername: string;
}

const GiftLitterLicenseButton = ({ friendId, friendUsername }: GiftLitterLicenseButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGifting, setIsGifting] = useState(false);
  const [userLicenseCount, setUserLicenseCount] = useState<number | null>(null);

  const checkUserLicenses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('litter_licenses')
      .select('id')
      .eq('user_id', user.id)
      .eq('used', false);

    if (error) {
      console.error('Error fetching user licenses:', error);
      return;
    }

    setUserLicenseCount(data?.length || 0);
  };

  const handleGiftLicense = async () => {
    if (!user) return;

    setIsGifting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gift-litter-license', {
        body: {
          gifter_id: user.id,
          recipient_id: friendId
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Gift Sent!",
          description: data.message,
        });
        setIsOpen(false);
        setUserLicenseCount(prev => prev ? prev - 1 : 0);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error gifting litter license:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to gift litter license",
        variant: "destructive",
      });
    } finally {
      setIsGifting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      checkUserLicenses();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Gift className="w-3 h-3" />
          Gift LL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-600" />
            Gift Litter License
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-lg font-medium">
              Gift a Litter License to <span className="text-pink-600">{friendUsername}</span>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You currently have {userLicenseCount !== null ? userLicenseCount : '...'} unused litter licenses
            </p>
          </div>
          
          {userLicenseCount === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">
                You don't have any unused litter licenses to gift
              </p>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isGifting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGiftLicense}
              disabled={isGifting || userLicenseCount === 0}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {isGifting ? 'Gifting...' : 'Gift License'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiftLitterLicenseButton;