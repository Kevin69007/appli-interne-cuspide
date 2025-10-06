import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, CheckCircle, Clock, DollarSign, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CompletedSession {
  sessionId: string;
  amount: number;
  pawDollars: number;
  created: number;
  paymentIntentId?: string;
}

interface DebugInfo {
  userEmail?: string;
  customersFound?: number;
  userIdMatched?: string;
  pendingInDatabase?: number;
}

const PaymentRecoverySection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [processing, setProcessing] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [searchAttempted, setSearchAttempted] = useState(false);

  const findCompletedSessions = async () => {
    if (!user) return;

    setLoading(true);
    setSearchAttempted(true);
    try {
      console.log("🔍 Searching for completed unprocessed sessions...");

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No valid session found");
      }

      const { data, error } = await supabase.functions.invoke('manual-verify-payment', {
        body: { action: 'find_completed_sessions' },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        }
      });

      if (error) {
        console.error("Error finding sessions:", error);
        throw error;
      }

      console.log("Search results:", data);
      setCompletedSessions(data.completedSessions || []);
      setCurrentBalance(data.currentBalance || 0);
      setDebugInfo(data.debugInfo || {});

      if (data.completedSessions?.length > 0) {
        const dbSessions = data.completedSessions.filter((s: any) => s.source === 'database').length;
        const stripeSessions = data.completedSessions.filter((s: any) => s.source === 'stripe').length;
        
        toast({
          title: "Unprocessed Payments Found!",
          description: `Found ${data.completedSessions.length} payment(s): ${dbSessions} pending in database, ${stripeSessions} from Stripe.`,
          duration: 10000,
        });
      } else {
        toast({
          title: "No Missing Payments Found",
          description: "We searched both your database records and recent Stripe payments but couldn't find any that need processing. If you just made a payment, please wait a few minutes and try again.",
          duration: 8000,
        });
      }
    } catch (error: any) {
      console.error("Error finding completed sessions:", error);
      toast({
        title: "Search Failed",
        description: `Failed to search for completed payments: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processSession = async (sessionId: string) => {
    if (!user) return;

    setProcessing(sessionId);
    try {
      console.log(`🔄 Processing session: ${sessionId}`);

      const { data, error } = await supabase.functions.invoke('manual-verify-payment', {
        body: { 
          action: 'process_session',
          sessionId: sessionId 
        }
      });

      if (error) {
        console.error("Error processing session:", error);
        throw error;
      }

      console.log("Processing result:", data);

      if (data.success) {
        toast({
          title: "Payment Processed!",
          description: `Successfully credited ${data.result.pawDollarsAdded} Paw Dollars to your account.`,
          duration: 10000,
        });

        // Remove this session from the list
        setCompletedSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        
        // Refresh to get updated balance
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.result?.error || "Processing failed");
      }
    } catch (error: any) {
      console.error("Error processing session:", error);
      toast({
        title: "Processing Failed",
        description: `Failed to process payment: ${error.message}`,
        variant: "destructive",
        duration: 15000,
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!user) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-5 h-5" />
          Payment Recovery
        </CardTitle>
        <CardDescription>
          If you've made a payment but haven't received your Paw Dollars, use this tool to find and process completed payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button 
            onClick={findCompletedSessions}
            disabled={loading}
            variant="outline"
            className="border-orange-300 hover:bg-orange-100"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Searching Database & Stripe...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Find Missing Payments
              </>
            )}
          </Button>
          {currentBalance > 0 && (
            <Badge variant="secondary" className="text-sm">
              Current Balance: {currentBalance.toLocaleString()} PD
            </Badge>
          )}
        </div>

        {/* Enhanced Debug Information */}
        {searchAttempted && debugInfo.userEmail && (
          <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
            <div>Search performed for: {debugInfo.userEmail}</div>
            <div>Stripe customers found: {debugInfo.customersFound || 0}</div>
            <div>Pending in database: {debugInfo.pendingInDatabase || 0}</div>
            <div>User ID: {debugInfo.userIdMatched?.slice(-8)}...</div>
          </div>
        )}

        {completedSessions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-orange-800">Unprocessed Payments Found:</h4>
            {completedSessions.map((session) => (
              <div key={session.sessionId} className="p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{session.pawDollars} Paw Dollars</span>
                      <Badge variant="outline" className="text-xs">
                        ${(session.amount / 100).toFixed(2)}
                      </Badge>
                      {(session as any).source === 'database' && (
                        <Badge className="text-xs bg-blue-100 text-blue-800">Pending in DB</Badge>
                      )}
                      {(session as any).source === 'stripe' && (
                        <Badge className="text-xs bg-green-100 text-green-800">From Stripe</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      {new Date(session.created * 1000).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      Session: {session.sessionId.slice(-12)}
                    </div>
                  </div>
                  <Button
                    onClick={() => processSession(session.sessionId)}
                    disabled={processing === session.sessionId}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === session.sessionId ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Credit Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchAttempted && completedSessions.length === 0 && (
          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
            <div className="font-medium mb-1">🔍 Search Complete</div>
            <div>No unprocessed payments found. If you just completed a payment:</div>
            <ul className="list-disc list-inside mt-1 text-xs space-y-1">
              <li>Wait 2-3 minutes and try searching again</li>
              <li>Check your email for Stripe payment confirmation</li>
              <li>Ensure you used the same email address for payment</li>
              <li>Try the "Process All Pending Payments" button above</li>
              <li>Refresh this page and check if your balance updated</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentRecoverySection;
