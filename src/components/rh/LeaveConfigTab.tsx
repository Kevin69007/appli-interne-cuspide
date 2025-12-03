import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, addYears, setMonth, setDate } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  fetchLeaveConfig, 
  saveLeaveConfig, 
  calculateLeaveBalance, 
  calculatePeriodDates,
  LeaveConfig,
  LeaveBalance 
} from "@/lib/leaveBalanceUtils";

interface LeaveConfigTabProps {
  employeeId: string;
  onClose?: () => void;
}

const MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export const LeaveConfigTab = ({ employeeId, onClose }: LeaveConfigTabProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<LeaveConfig>({
    employee_id: employeeId,
    period_start_month: 1,
    total_days_allowed: 25,
    reference_year: new Date().getFullYear(),
    day_type: 'ouvre',
    weekly_hours: 35
  });
  const [balance, setBalance] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    loadConfig();
  }, [employeeId]);

  const loadConfig = async () => {
    setLoading(true);
    const savedConfig = await fetchLeaveConfig(employeeId);
    if (savedConfig) {
      setConfig(savedConfig);
    } else {
      setConfig({
        employee_id: employeeId,
        period_start_month: 1,
        total_days_allowed: 25,
        reference_year: new Date().getFullYear(),
        day_type: 'ouvre',
        weekly_hours: 35
      });
    }
    
    const bal = await calculateLeaveBalance(employeeId);
    setBalance(bal);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveLeaveConfig(config);
    if (success) {
      toast.success("Configuration des congés enregistrée");
      const bal = await calculateLeaveBalance(employeeId);
      setBalance(bal);
    } else {
      toast.error("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  const { start, end } = calculatePeriodDates(config.period_start_month, config.reference_year);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const dayTypeLabel = config.day_type === 'ouvre' ? 'ouvrés' : 'ouvrables';

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="period_start">Période de référence (mois de début)</Label>
        <Select
          value={String(config.period_start_month)}
          onValueChange={(value) => setConfig({ ...config, period_start_month: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le mois" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Période : {format(start, "MMMM yyyy", { locale: fr })} → {format(end, "MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div>
        <Label htmlFor="total_days">Jours de congés alloués</Label>
        <Input
          id="total_days"
          type="number"
          min={0}
          max={365}
          value={config.total_days_allowed}
          onChange={(e) => setConfig({ ...config, total_days_allowed: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div>
        <Label htmlFor="weekly_hours">Heures hebdomadaires contractuelles</Label>
        <Input
          id="weekly_hours"
          type="number"
          step="0.5"
          min={10}
          max={60}
          value={config.weekly_hours}
          onChange={(e) => setConfig({ ...config, weekly_hours: parseFloat(e.target.value) || 35 })}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Base journalière : {(config.weekly_hours / 5).toFixed(1)}h/jour
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="day_type">Type de calcul</Label>
          <p className="text-sm text-muted-foreground">
            {config.day_type === 'ouvre' ? 'Jours ouvrés (lun-ven)' : 'Jours ouvrables (lun-sam)'}
          </p>
        </div>
        <Switch
          id="day_type"
          checked={config.day_type === 'ouvrable'}
          onCheckedChange={(checked) => setConfig({ ...config, day_type: checked ? 'ouvrable' : 'ouvre' })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Activé = jours ouvrables | Désactivé = jours ouvrés
      </p>

      <div>
        <Label htmlFor="reference_year">Année de référence</Label>
        <Select
          value={String(config.reference_year)}
          onValueChange={(value) => setConfig({ ...config, reference_year: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {balance && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">Résumé des soldes</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Alloués :</span>
                <span className="font-medium ml-2">{balance.totalAllowed} j</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pris :</span>
                <span className="font-medium ml-2">{balance.approvedDays} j</span>
              </div>
              <div>
                <span className="text-muted-foreground">Solde actuel :</span>
                <span className={`font-medium ml-2 ${balance.remainingApproved >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance.remainingApproved} j
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">En attente :</span>
                <span className="font-medium ml-2 text-orange-500">{balance.pendingDays} j</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              (en jours {dayTypeLabel})
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};
