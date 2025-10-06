
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Check, Loader2, X, RefreshCw, CheckCircle, Calendar } from "lucide-react";
import { usePawClubSubscription } from "@/hooks/usePawClubSubscription";
import PawClubBadge from "@/components/PawClubBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PawClubSection = () => {
  const { 
    subscribed, 
    subscription_end, 
    will_cancel,
    loading, 
    createCheckout, 
    cancelSubscription,
    checkSubscription 
  } = usePawClubSubscription();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Use the will_cancel flag from Stripe instead of inferring
  const isSetToCancel = subscribed && will_cancel;
  const isAutoRenewing = subscribed && !will_cancel;

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Checking subscription status with Stripe...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-purple-600" />
            PawClub Premium Membership
            {subscribed && <PawClubBadge />}
          </CardTitle>
          <CardDescription>
            Exclusive benefits and premium features for dedicated pet carers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscribed ? (
            <div className="space-y-4">
              {/* Auto-Renew Status Card */}
              {isAutoRenewing && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">✅ Auto-Renew Active</h3>
                      <p className="text-green-700 text-sm">Your membership will continue automatically</p>
                    </div>
                  </div>
                  {subscription_end && (
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Next billing date: {formatDate(subscription_end)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-green-600 mt-2">
                    🎉 No action needed! Your PawClub benefits will continue uninterrupted. 
                    You'll be charged automatically and retain all premium features.
                  </p>
                </div>
              )}

              {/* Cancellation Status Card */}
              {isSetToCancel && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">
                      PawClub Member (Scheduled to Cancel)
                    </span>
                  </div>
                  {subscription_end && (
                    <div className="flex items-center gap-2 bg-orange-100 px-3 py-2 rounded-lg mb-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">
                        Membership expires: {formatDate(subscription_end)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-orange-600">
                    Your membership will not auto-renew. You'll keep access until the expiration date above.
                  </p>
                </div>
              )}

              {/* Regular Active Status for fallback */}
              {!isAutoRenewing && !isSetToCancel && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Active PawClub Member</span>
                  </div>
                  {subscription_end && (
                    <p className="text-sm text-blue-600">
                      Current period ends: {formatDate(subscription_end)}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-800">Your Premium Benefits:</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• 10 bonus Paw Dollars daily</li>
                    <li>• Feed All & Water All buttons</li>
                    <li>• 20,000 XP daily limit (vs 10,000)</li>
                    <li>• Exclusive PawClub badge</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  {!isSetToCancel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                          disabled={loading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Auto-Renew
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel PawClub Auto-Renew</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel auto-renew for your PawClub membership? You'll lose access to all premium benefits at the end of your current billing period, but you can resubscribe at any time.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Auto-Renew</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={cancelSubscription}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Cancel Auto-Renew
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button 
                    onClick={checkSubscription} 
                    variant="outline" 
                    className="w-full"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? "Checking..." : "Refresh Status"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="border-purple-300 bg-purple-50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    PawClub Premium
                  </CardTitle>
                  <div className="text-3xl font-bold text-purple-800">
                    $9.99<span className="text-lg font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>10 bonus Paw Dollars daily at login</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Feed All & Water All buttons for convenience</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Increased daily XP limit (20,000 vs 10,000)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Exclusive PawClub badge on profile & forums</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={createCheckout} 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                    disabled={loading}
                  >
                    Subscribe to PawClub
                  </Button>
                  
                  <Button 
                    onClick={checkSubscription} 
                    variant="outline" 
                    className="w-full"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? "Checking..." : "Check Status with Stripe"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PawClubSection;
