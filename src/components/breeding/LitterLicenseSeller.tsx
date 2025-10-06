import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, DollarSign, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LitterLicense {
  id: string;
  created_at: string;
  used: boolean;
}

const LitterLicenseSeller = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<LitterLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState<string | null>(null);

  const fetchLicenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('litter_licenses')
        .select('id, created_at, used')
        .eq('user_id', user.id)
        .eq('used', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching litter licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load litter licenses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [user]);

  const handleSellLicense = async (licenseId: string) => {
    if (!user || selling) return;

    setSelling(licenseId);
    try {
      const { data, error } = await supabase.functions.invoke('sell-litter-license', {
        body: {
          user_id: user.id,
          license_id: licenseId
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "License Sold! 💰",
          description: data.message,
          duration: 4000
        });
        
        // Refresh licenses list
        await fetchLicenses();
      } else {
        throw new Error(data?.error || 'Failed to sell license');
      }
    } catch (error) {
      console.error('Error selling license:', error);
      toast({
        title: "Sale Failed",
        description: "Failed to sell litter license. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSelling(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Sell Litter Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-pink-200">
      <CardHeader>
        <CardTitle className="text-pink-800 flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Sell Litter Licenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Package className="w-4 h-4" />
            <span>You have {licenses.length} unused litter license{licenses.length !== 1 ? 's' : ''}</span>
          </div>

          {licenses.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-pink-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-pink-800 mb-2">No Licenses to Sell</h3>
              <p className="text-muted-foreground text-sm">
                You don't have any unused litter licenses to sell.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                <div className="flex items-center gap-2 text-sm font-medium text-pink-800 mb-1">
                  <DollarSign className="w-4 h-4" />
                  Price: 50 Paw Dollars each
                </div>
                <p className="text-xs text-pink-600">
                  Licenses are sold immediately and removed from your inventory.
                </p>
              </div>

              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {licenses.map((license, index) => (
                  <div key={license.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-4 h-4 text-pink-500" />
                      <div>
                        <span className="text-sm font-medium">License #{index + 1}</span>
                        <p className="text-xs text-muted-foreground">
                          Acquired: {new Date(license.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSellLicense(license.id)}
                      disabled={selling === license.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {selling === license.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          Selling...
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Sell for 50 PD
                        </div>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LitterLicenseSeller;