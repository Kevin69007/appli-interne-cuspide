
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePawClubSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPawClubMember, setIsPawClubMember] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscription_end, setSubscriptionEnd] = useState<string | null>(null);
  const [will_cancel, setWillCancel] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setIsPawClubMember(false);
      setSubscribed(false);
      setSubscriptionEnd(null);
      setWillCancel(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Checking subscription status...");
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error("Error checking subscription:", error);
        setIsPawClubMember(false);
        setSubscribed(false);
        setSubscriptionEnd(null);
        setWillCancel(false);
      } else {
        console.log("Subscription check result:", data);
        const isSubscribed = data?.subscribed || false;
        setIsPawClubMember(isSubscribed);
        setSubscribed(isSubscribed);
        setSubscriptionEnd(data?.subscription_end || null);
        setWillCancel(data?.will_cancel || false);
      }
    } catch (error) {
      console.error("Error in subscription check:", error);
      setIsPawClubMember(false);
      setSubscribed(false);
      setSubscriptionEnd(null);
      setWillCancel(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const createCheckout = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          user_id: user.id,
          price_id: 'price_1QTlz9P5nzJgj1n1hJUMxBEV', // PawClub price ID
          success_url: `${window.location.origin}/bank?success=true`,
          cancel_url: `${window.location.origin}/bank?canceled=true`
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const cancelSubscription = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('cancel-subscription');
      
      if (error) {
        console.error('Cancel subscription error:', error);
        toast({
          title: "Error",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription will not auto-renew at the end of the current period.",
        });
        // Refresh subscription status
        await checkSubscription();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    isPawClubMember,
    subscribed,
    subscription_end,
    will_cancel,
    loading,
    createCheckout,
    cancelSubscription,
    checkSubscription
  };
};
