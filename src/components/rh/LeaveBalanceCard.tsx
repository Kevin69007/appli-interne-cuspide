import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
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
  const { t, i18n } = useTranslation("rh");
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const dateLocale = i18n.language === 'fr' ? fr : enUS;

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
  const dayTypeLabel = balance.dayType === 'ouvre' ? t("leaveBalance.workingDays") : t("leaveBalance.businessDays");

  if (compact) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t("leaveBalance.myBalance")}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("leaveBalance.currentBalance")}</p>
              <p className={`text-2xl font-bold ${balance.remainingApproved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.remainingApproved} j
              </p>
              <p className="text-xs text-muted-foreground">({dayTypeLabel})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("leaveBalance.provisionalBalance")}</p>
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
                  {pendingCount} {t("leaveBalance.pendingRequests")} →
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("leaveBalance.period")} : {format(balance.periodStart, "MMM yyyy", { locale: dateLocale })} - {format(balance.periodEnd, "MMM yyyy", { locale: dateLocale })}
              {" | "} {t("leaveBalance.totalAllocated")} : {balance.totalAllowed} j ({dayTypeLabel})
            </p>
            {!balance.hasConfig && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t("leaveBalance.defaultConfig")}
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
          {t("leaveBalance.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{t("leaveBalance.allocated")}</p>
            <p className="text-2xl font-bold">{balance.totalAllowed}</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">{t("leaveBalance.remaining")}</p>
            <p className={`text-2xl font-bold ${balance.remainingApproved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance.remainingApproved}
            </p>
          </div>
          <div className="text-center p-3 bg-orange-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">{t("leaveBalance.provisional")}</p>
            <p className={`text-2xl font-bold ${balance.remainingWithPending >= 0 ? 'text-orange-500' : 'text-red-600'}`}>
              {balance.remainingWithPending}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{t("leaveBalance.period")} : {format(balance.periodStart, "d MMMM yyyy", { locale: dateLocale })} - {format(balance.periodEnd, "d MMMM yyyy", { locale: dateLocale })}</p>
          <p>Type : {dayTypeLabel}</p>
          <p>{t("leaveBalance.taken")} : {balance.approvedDays} j | {t("leaveConfig.pending")} : {balance.pendingDays} j</p>
        </div>
      </CardContent>
    </Card>
  );
};
