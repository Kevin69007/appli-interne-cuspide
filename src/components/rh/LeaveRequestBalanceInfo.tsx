import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { calculateLeaveBalance, calculateDaysFromDetail, LeaveBalance } from "@/lib/leaveBalanceUtils";

interface LeaveRequestBalanceInfoProps {
  employeeId: string;
  requestDetail: string;
}

export const LeaveRequestBalanceInfo = ({
  employeeId,
  requestDetail
}: LeaveRequestBalanceInfoProps) => {
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

  if (loading || !balance) return null;

  const requestDays = calculateDaysFromDetail(requestDetail, balance.dayType);
  const balanceBefore = balance.remainingApproved;
  const balanceAfter = balanceBefore - requestDays;
  const dayTypeLabel = balance.dayType === 'ouvre' ? 'ouvrés' : 'ouvrables';

  return (
    <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
      <div className="text-xs text-muted-foreground mb-2">
        Demande de {requestDays} jour(s) {dayTypeLabel}
      </div>
      <div className="flex justify-between text-sm">
        <span>Solde avant acceptation :</span>
        <span className={`font-medium ${balanceBefore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {balanceBefore} jour(s)
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Solde après acceptation :</span>
        <span className={`font-medium ${balanceAfter >= 0 ? 'text-orange-500' : 'text-red-600'}`}>
          {balanceAfter} jour(s)
        </span>
      </div>
      {balanceAfter < 0 && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
          <AlertCircle className="h-3 w-3" />
          Attention : dépassement du solde de congés
        </p>
      )}
    </div>
  );
};
