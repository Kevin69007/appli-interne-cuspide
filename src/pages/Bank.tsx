import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Star, CreditCard, AlertCircle, CheckCircle, DollarSign, Shield, Award, Crown, Sparkles, Zap, Gem, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TransactionsTab from "@/components/bank/TransactionsTab";
import PaymentRecoverySection from "@/components/bank/PaymentRecoverySection";
import PawClubSection from "@/components/bank/PawClubSection";
import { RefreshCw } from "lucide-react";
import { calculateDiscountedPrice, isPromotionActive, formatPromotionEndDate } from "@/utils/discountUtils";

const Bank = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [processingPending, setProcessingPending] = useState(false);
  const [activeTab, setActiveTab] = useState("purchase");

  // Check for payment success on component mount and auto-verify
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    console.log("🔍 Bank useEffect - URL params:", { sessionId, success, canceled });

    if (success === 'true' && sessionId) {
      console.log("✅ Payment success detected, auto-verifying payment with session ID:", sessionId);
      autoVerifyPayment(sessionId);
    } else if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. No charges were made.",
        variant: "destructive",
      });
      // Clean up URL parameters
      navigate("/bank", { replace: true });
    }
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Enhanced auto-verification function with better error handling and retries
  const autoVerifyPayment = async (sessionId: string) => {
    if (!user || verifyingPayment) return;

    setVerifyingPayment(true);
    
    try {
      console.log("🚀 [AUTO-VERIFY] Starting enhanced auto-verification:", sessionId);
      
      // Get fresh auth token with retries
      let session;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries) {
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !sessionData?.session?.access_token) {
            throw new Error("No valid session found");
          }
          session = sessionData;
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          console.log(`⚠️ [AUTO-VERIFY] Retry ${retryCount} getting auth session in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log("🔑 [AUTO-VERIFY] Got auth session, calling verify-payment function");
      
      // Call verify-payment with enhanced retries
      let verifyData;
      retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: { sessionId },
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
            }
          });

          if (error) {
            console.error(`❌ [AUTO-VERIFY] Verify-payment error (attempt ${retryCount + 1}):`, error);
            throw error;
          }
          
          verifyData = data;
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.error(`❌ [AUTO-VERIFY] All ${maxRetries} verify-payment attempts failed`);
            throw error;
          }
          console.log(`⚠️ [AUTO-VERIFY] Retry ${retryCount} calling verify-payment in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      console.log("📞 [AUTO-VERIFY] Verify-payment response:", verifyData);

      if (verifyData?.success) {
        console.log("🎉 [AUTO-VERIFY] INSTANT CREDIT SUCCESS!");
        toast({
          title: "💰 Payment Successful!",
          description: `Instant credit complete! You received ${verifyData.pawDollarsAdded || 'your'} Paw Dollars! New balance: ${verifyData.newTotal || 'updated'} PD.`,
          duration: 10000,
        });
        
        // Refresh profile to show new balance
        await fetchProfile();
        
        // Clean up URL after successful verification
        navigate("/bank", { replace: true });
      } else if (verifyData?.alreadyProcessed) {
        console.log("⚠️ [AUTO-VERIFY] Payment already processed");
        toast({
          title: "Payment Already Processed",
          description: `This payment has already been credited to your account. You received ${verifyData.pawDollarsAdded || 'your'} Paw Dollars!`,
          variant: "default",
        });
        await fetchProfile();
        navigate("/bank", { replace: true });
      } else {
        console.log("❌ [AUTO-VERIFY] Auto-verification failed, offering manual recovery");
        toast({
          title: "Payment Processing",
          description: "We're processing your payment. Please use the 'Find Missing Payments' button below to complete the process.",
          duration: 15000,
        });
        navigate("/bank", { replace: true });
      }
    } catch (error: any) {
      console.error("💥 [AUTO-VERIFY] Auto-verification failed:", error);
      
      toast({
        title: "Payment Verification Issue",
        description: "Your payment may still be processing. Please use the 'Find Missing Payments' button below to check for your payment.",
        duration: 20000,
      });
      
      // Still refresh profile in case payment went through
      await fetchProfile();
      navigate("/bank", { replace: true });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("paw_dollars, paw_points")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      console.log("📊 Profile refreshed, new balance:", data.paw_dollars);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handlePurchase = async (pawDollars: number, priceInCents: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase Paw Dollars.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`Creating payment for ${pawDollars} Paw Dollars (${priceInCents} cents) for user:`, user.id);
      
      // Get fresh auth token
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Authentication session expired");
      }
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: pawDollars,
          priceInCents: priceInCents
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        }
      });

      console.log("Payment creation response:", { data, error });

      if (error) {
        console.error("Payment creation error:", error);
        throw error;
      }

      if (data?.url) {
        console.log("Redirecting to Stripe checkout:", data.url);
        // Use same-tab redirect instead of new tab for better reliability
        window.location.href = data.url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      
      let errorMessage = "Failed to create payment session. Please try again.";
      
      if (error.message?.includes("configuration")) {
        errorMessage = "Payment system is temporarily unavailable. Please try again later.";
      } else if (error.message?.includes("Invalid amounts")) {
        errorMessage = "Invalid purchase amount. Please refresh the page and try again.";
      } else if (error.message?.includes("Authentication")) {
        errorMessage = "Please sign in again to make a purchase.";
      } else if (error.message?.includes("session expired")) {
        errorMessage = "Your session has expired. Please refresh the page and try again.";
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced process pending payments function
  const processPendingPayments = async () => {
    if (!user || processingPending) return;

    setProcessingPending(true);
    try {
      console.log("🔄 Processing all pending payments...");
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Authentication session expired");
      }

      const { data, error } = await supabase.functions.invoke('manual-verify-payment', {
        body: { action: 'process_pending' },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        }
      });

      if (error) {
        console.error("Error processing pending payments:", error);
        throw error;
      }

      console.log("Process pending result:", data);

      if (data.success && data.processedCount > 0) {
        toast({
          title: "Payments Processed!",
          description: `Successfully processed ${data.processedCount} pending payment(s). You received ${data.totalCredits} Paw Dollars total.`,
          duration: 10000,
        });
        
        // Refresh profile to show new balance
        await fetchProfile();
      } else {
        toast({
          title: "No Pending Payments",
          description: "No pending payments found to process.",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error processing pending payments:", error);
      toast({
        title: "Processing Failed",
        description: `Failed to process pending payments: ${error.message}`,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setProcessingPending(false);
    }
  };

  const promotionActive = isPromotionActive();

  if (verifyingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
        <div className="absolute inset-0 opacity-5 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
        <Navigation />
        <div className="pt-24 px-6 max-w-4xl mx-auto relative z-10">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <div>
                  <p className="font-semibold text-green-800">Processing your payment...</p>
                  <p className="text-sm text-green-600">Please wait while we instantly credit your Paw Dollars.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative">
      <div className="absolute inset-0 opacity-5 bg-repeat" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ec4899' fill-opacity='1'%3E%3Cpath d='M25 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm10 0c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm-5 15c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7zm-10-5c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3zm20 0c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
      
      <Navigation />
      <main className="pt-24 px-6 max-w-6xl mx-auto pb-20 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Paw Bank</h1>
          </div>
          <p className="text-gray-600">Manage your Paw Dollars and Paw Points</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-600 font-medium">Paw Dollars</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {profile?.paw_dollars?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-600 font-medium">Paw Points</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {profile?.paw_points?.toLocaleString() || "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Payment Recovery Section */}
        <div className="mb-8">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                Payment Recovery & Processing
              </CardTitle>
              <CardDescription>
                If you've made a payment but haven't received your Paw Dollars, use these tools to find and process completed payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  onClick={processPendingPayments}
                  disabled={processingPending}
                  className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {processingPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing All Pending...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Process All Pending Payments
                    </>
                  )}
                </Button>
                
                {profile?.paw_dollars > 0 && (
                  <Badge variant="secondary" className="text-sm bg-white/80 backdrop-blur-sm">
                    Current Balance: {profile.paw_dollars.toLocaleString()} PD
                  </Badge>
                )}
              </div>
              
              <PaymentRecoverySection />
            </CardContent>
          </Card>
        </div>

        <div className="flex border-b border-gray-200 mb-8">
          <button 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "purchase" 
                ? "text-gray-900 border-b-2 border-pink-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("purchase")}
          >
            Purchase Paw Dollars
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "transactions" 
                ? "text-gray-900 border-b-2 border-pink-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "pawclub" 
                ? "text-gray-900 border-b-2 border-pink-500" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pawclub")}
          >
            PawClub
          </button>
        </div>

        {activeTab === "purchase" && (
          <div className="mb-8">
            {/* Promotion Banner */}
            {promotionActive && (
              <div className="mb-8">
                <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-red-700">🎉 LIMITED TIME OFFER!</h3>
                          <p className="text-red-600 font-medium">Save 20% on ALL Paw Dollar packages</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-red-600 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>Ends {formatPromotionEndDate()}</span>
                        </div>
                        <Badge className="bg-red-500 text-white mt-1">20% OFF</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-pink-500" />
              <h2 className="text-xl font-bold text-pink-600">Purchase Paw Dollars</h2>
              {promotionActive && <Badge className="bg-red-500 text-white">20% OFF</Badge>}
            </div>
            <p className="text-sm text-gray-600 mb-6">Secure payments powered by Stripe - Instant crediting after payment</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Perfect Starter Pack */}
              {(() => {
                const discount = calculateDiscountedPrice(499);
                return (
                  <Card className="group border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-cyan-50 relative">
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-blue-600 text-lg">Perfect Starter Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-blue-700">100 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(100, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Great Value Pack */}
              {(() => {
                const discount = calculateDiscountedPrice(999);
                return (
                  <Card className="group border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 relative">
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-green-600 text-lg">Great Value Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-green-700">200 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(200, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Most Popular Choice */}
              {(() => {
                const discount = calculateDiscountedPrice(1999);
                return (
                  <Card className="group border-2 border-purple-400 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
                      Popular
                    </Badge>
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Gem className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-purple-600 text-lg">Most Popular Choice</CardTitle>
                      <CardDescription className="text-2xl font-bold text-purple-700">450 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(450, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Power User Pack */}
              {(() => {
                const discount = calculateDiscountedPrice(3999);
                return (
                  <Card className="group border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-red-50 relative">
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-orange-600 text-lg">Power User Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-orange-700">1000 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(1000, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Premium Pack - Best Value */}
              {(() => {
                const discount = calculateDiscountedPrice(5299);
                return (
                  <Card className="group border-2 border-red-400 hover:border-red-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-red-50 to-pink-50 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                      Best Value
                    </Badge>
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-red-600 text-lg">Premium Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-red-700">1500 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(1500, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Ultimate Pack */}
              {(() => {
                const discount = calculateDiscountedPrice(9999);
                return (
                  <Card className="group border-2 border-indigo-400 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-blue-50 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg">
                      Ultimate
                    </Badge>
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-indigo-600 text-lg">Ultimate Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-indigo-700">3125 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(3125, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Serious Collector Pack - Bronze Elite */}
              {(() => {
                const discount = calculateDiscountedPrice(14999);
                return (
                  <Card className="group border-2 border-yellow-400 hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-amber-50 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg">
                      Bronze Elite
                    </Badge>
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-yellow-600 text-lg">Serious Collector Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-yellow-700">5000 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(5000, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Elite Breeder Pack - Diamond */}
              {(() => {
                const discount = calculateDiscountedPrice(19999);
                return (
                  <Card className="group border-2 border-cyan-400 hover:border-cyan-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-cyan-50 to-teal-50 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg">
                      Diamond
                    </Badge>
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Gem className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-cyan-600 text-lg">Elite Breeder Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-cyan-700">7000 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(7000, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Professional Breeder Pack - Elite Master */}
              {(() => {
                const discount = calculateDiscountedPrice(34999);
                return (
                  <Card className="group border-2 border-yellow-600 hover:border-yellow-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-orange-50 relative">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-700 to-orange-600 text-white shadow-lg">
                      Elite Master
                    </Badge>
                    {promotionActive && (
                      <Badge className="absolute -top-3 -right-3 bg-red-500 text-white shadow-lg z-10">
                        Save ${discount.savings.toFixed(2)}
                      </Badge>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-600 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-yellow-700 text-lg">Professional Breeder Pack</CardTitle>
                      <CardDescription className="text-2xl font-bold text-yellow-800">13000 PD</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-4">
                        {promotionActive ? (
                          <div>
                            <div className="text-lg text-gray-500 line-through">${discount.originalPrice.toFixed(2)}</div>
                            <div className="text-3xl font-bold text-green-600">${discount.discountedPrice.toFixed(2)}</div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold text-gray-800">${discount.originalPrice.toFixed(2)}</div>
                        )}
                      </div>
                      <Button
                        onClick={() => handlePurchase(13000, discount.discountedPriceInCents)}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        {loading ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "transactions" && <TransactionsTab />}
        {activeTab === "pawclub" && <PawClubSection />}
      </main>
      <Footer />
    </div>
  );
};

export default Bank;
