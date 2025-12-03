import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { calculateLeaveBalance, LeaveBalance } from "@/lib/leaveBalanceUtils";

interface LeaveBalanceCardProps {
  employeeId: string;
  showPendingLink?: boolean;
  compact?: boolean;
  onPendingClick?: () => void;
}

export const LeaveBalanceCard = ({
  employeeId,
  showPendingLink = false,
  compact = false,
  onPendingClick
}: LeaveBalanceCardProps) => {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      const result = await calculateLeaveBalance(employeeId);
      setBalance(result);
      setLoading(false);
    };

    if (employeeId) {
      fetchBalance();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <Card className={compact ? "bg-primary/5" : ""}>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <Skeleton className="h-8 w-32 mb-2" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const pendingCount = balance.pendingDays;
  const dayTypeLabel = balance.dayType === 'ouvre' ? 'ouvrés' : 'ouvrables';

  if (compact) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Mon solde de congés</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p className={`text-2xl font-bold ${balance.remainingApproved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.remainingApproved} j
              </p>
              <p className="text-xs text-muted-foreground">({dayTypeLabel})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solde prévisionnel</p>
              <p className={`text-2xl font-bold ${balance.remainingWithPending >= 0 ? 'text-orange-500' : 'text-red-600'}`}>
                {balance.remainingWithPending} j
              </p>
              {pendingCount > 0 && showPendingLink && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={onPendingClick}
                >
                  {pendingCount} demande(s) en attente →
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Période : {format(balance.periodStart, "MMM yyyy", { locale: fr })} - {format(balance.periodEnd, "MMM yyyy", { locale: fr })}
              {" | "} Total alloué : {balance.totalAllowed} j ({dayTypeLabel})
            </p>
            {!balance.hasConfig && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Configuration par défaut (demandez à votre manager)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Solde de congés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Alloués</p>
            <p className="text-2xl font-bold">{balance.totalAllowed}</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Restants</p>
            <p className={`text-2xl font-bold ${balance.remainingApproved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance.remainingApproved}
            </p>
          </div>
          <div className="text-center p-3 bg-orange-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Prévisionnel</p>
            <p className={`text-2xl font-bold ${balance.remainingWithPending >= 0 ? 'text-orange-500' : 'text-red-600'}`}>
              {balance.remainingWithPending}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Période : {format(balance.periodStart, "d MMMM yyyy", { locale: fr })} - {format(balance.periodEnd, "d MMMM yyyy", { locale: fr })}</p>
          <p>Type : jours {dayTypeLabel}</p>
          <p>Pris : {balance.approvedDays} j | En attente : {balance.pendingDays} j</p>
        </div>
      </CardContent>
    </Card>
  );
};
