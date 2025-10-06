import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, CreditCard, Gift, Users, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PawClubSection from "./PawClubSection";
import NovaClubSection from "./NovaClubSection";
import TransactionsTab from "./TransactionsTab";
import Navigation from "@/components/Navigation";
import { isPromotionActive } from "@/utils/discountUtils";

const BankPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'paw-club' | 'nova-club' | 'transactions'>('paw-club');
  const showPromoBanner = isPromotionActive();

  const handleStripeCheckout = async (priceId: string, pawDollars: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to make a purchase.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, pawDollars, userId: user.id }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const packages = [
    {
      id: 'price_1QRvnlP5rA6VXqiGMhYvdxhh',
      name: 'Starter Pack',
      pawDollars: 500,
      price: '$4.99',
      popular: false,
      icon: <Coins className="w-6 h-6" />
    },
    {
      id: 'price_1QRvo9P5rA6VXqiGyLwXMdIY',
      name: 'Value Pack',
      pawDollars: 1200,
      price: '$9.99',
      popular: true,
      icon: <Gift className="w-6 h-6" />
    },
    {
      id: 'price_1QRvoRP5rA6VXqiGkJgB8tCk',
      name: 'Power Pack',
      pawDollars: 2500,
      price: '$19.99',
      popular: false,
      icon: <Crown className="w-6 h-6" />
    },
    {
      id: 'price_1QRvonP5rA6VXqiGPpQeXovF',
      name: 'Ultimate Pack',
      pawDollars: 7000,
      price: '$49.99',
      popular: false,
      icon: <Users className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <Navigation />
      
      <main className={showPromoBanner ? "page-with-nav-and-banner" : "page-with-nav"}>
        <div className="content-wrapper py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Paw Dollar Bank</h1>
            <p className="text-xl text-muted-foreground">
              Purchase Paw Dollars to enhance your pet care experience
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={activeTab === 'paw-club' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('paw-club')}
                className="rounded-md"
              >
                <Gift className="w-4 h-4 mr-2" />
                Paw Club
              </Button>
              <Button
                variant={activeTab === 'nova-club' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('nova-club')}
                className="rounded-md"
              >
                <Crown className="w-4 h-4 mr-2" />
                Nova Club
              </Button>
              <Button
                variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('transactions')}
                className="rounded-md"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </div>

          {activeTab === 'paw-club' && (
            <>
              {/* Paw Dollar Packages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary shadow-lg' : ''}`}>
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-2 text-primary">
                        {pkg.icon}
                      </div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <div className="text-2xl font-bold text-primary">
                        {pkg.pawDollars.toLocaleString()} PD
                      </div>
                      <div className="text-lg font-semibold">{pkg.price}</div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        onClick={() => handleStripeCheckout(pkg.id, pkg.pawDollars)}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        {loading ? "Processing..." : "Purchase"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <PawClubSection />
            </>
          )}

          {activeTab === 'nova-club' && <NovaClubSection />}
          {activeTab === 'transactions' && <TransactionsTab />}
        </div>
      </main>
    </div>
  );
};

export default BankPage;
