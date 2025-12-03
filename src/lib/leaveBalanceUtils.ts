import { supabase } from "@/integrations/supabase/client";
import { eachDayOfInterval, isSunday, isWeekend, parseISO, addYears, setMonth, setDate } from "date-fns";

export interface LeaveConfig {
  id?: string;
  employee_id: string;
  period_start_month: number;
  total_days_allowed: number;
  reference_year: number;
  day_type: 'ouvre' | 'ouvrable';
}

export interface LeaveBalance {
  totalAllowed: number;
  approvedDays: number;
  pendingDays: number;
  remainingApproved: number;
  remainingWithPending: number;
  periodStart: Date;
  periodEnd: Date;
  dayType: 'ouvre' | 'ouvrable';
  hasConfig: boolean;
}

// Calculate period dates based on start month
export const calculatePeriodDates = (startMonth: number, referenceYear: number): { start: Date; end: Date } => {
  const start = setDate(setMonth(new Date(referenceYear, 0, 1), startMonth - 1), 1);
  const end = addYears(start, 1);
  end.setDate(end.getDate() - 1); // End is the day before next period starts
  return { start, end };
};

// Calculate days from a detail string like "Du 01/01/2025 au 05/01/2025"
export const calculateDaysFromDetail = (detail: string, dayType: 'ouvre' | 'ouvrable'): number => {
  const detailMatch = detail?.match(/Du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
  if (!detailMatch) return 1;

  const [_, startStr, endStr] = detailMatch;
  const [startDay, startMonth, startYear] = startStr.split('/');
  const [endDay, endMonth, endYear] = endStr.split('/');

  const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
  const endDate = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  if (dayType === 'ouvre') {
    // Lundi-Vendredi
    return allDays.filter(day => !isWeekend(day)).length;
  } else {
    // Lundi-Samedi (exclude only Sunday)
    return allDays.filter(day => !isSunday(day)).length;
  }
};

// Fetch leave config for an employee
export const fetchLeaveConfig = async (employeeId: string, year?: number): Promise<LeaveConfig | null> => {
  const referenceYear = year || new Date().getFullYear();
  
  const { data, error } = await supabase
    .from("employee_leave_config")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("reference_year", referenceYear)
    .maybeSingle();

  if (error) {
    console.error("Error fetching leave config:", error);
    return null;
  }

  return data as LeaveConfig | null;
};

// Save or update leave config
export const saveLeaveConfig = async (config: LeaveConfig): Promise<boolean> => {
  const { error } = await supabase
    .from("employee_leave_config")
    .upsert({
      employee_id: config.employee_id,
      period_start_month: config.period_start_month,
      total_days_allowed: config.total_days_allowed,
      reference_year: config.reference_year,
      day_type: config.day_type,
    }, {
      onConflict: 'employee_id,reference_year'
    });

  if (error) {
    console.error("Error saving leave config:", error);
    return false;
  }

  return true;
};

// Calculate leave balance for an employee
export const calculateLeaveBalance = async (employeeId: string, year?: number): Promise<LeaveBalance> => {
  const referenceYear = year || new Date().getFullYear();
  
  // Default values if no config
  let config: LeaveConfig = {
    employee_id: employeeId,
    period_start_month: 1,
    total_days_allowed: 25,
    reference_year: referenceYear,
    day_type: 'ouvre'
  };

  const savedConfig = await fetchLeaveConfig(employeeId, referenceYear);
  const hasConfig = !!savedConfig;
  if (savedConfig) {
    config = savedConfig;
  }

  const { start: periodStart, end: periodEnd } = calculatePeriodDates(config.period_start_month, config.reference_year);

  // Fetch all leave entries in the period
  const { data: entries, error } = await supabase
    .from("agenda_entries")
    .select("date, detail, statut_validation")
    .eq("employee_id", employeeId)
    .eq("categorie", "absence")
    .eq("type_absence", "demande_conges")
    .gte("date", periodStart.toISOString().split('T')[0])
    .lte("date", periodEnd.toISOString().split('T')[0]);

  if (error) {
    console.error("Error fetching leave entries:", error);
  }

  // Group entries by detail to avoid double counting multi-day requests
  const processedDetails = new Set<string>();
  let approvedDays = 0;
  let pendingDays = 0;

  (entries || []).forEach(entry => {
    const detailKey = entry.detail || entry.date;
    
    // If we've already counted this detail, skip
    if (processedDetails.has(detailKey)) return;
    
    const days = entry.detail ? calculateDaysFromDetail(entry.detail, config.day_type) : 1;
    
    if (entry.statut_validation === 'valide') {
      approvedDays += days;
      processedDetails.add(detailKey);
    } else if (entry.statut_validation === 'en_attente') {
      pendingDays += days;
      processedDetails.add(detailKey);
    }
  });

  return {
    totalAllowed: config.total_days_allowed,
    approvedDays,
    pendingDays,
    remainingApproved: config.total_days_allowed - approvedDays,
    remainingWithPending: config.total_days_allowed - approvedDays - pendingDays,
    periodStart,
    periodEnd,
    dayType: config.day_type,
    hasConfig
  };
};

// Calculate balance for a specific leave request (before/after)
export const calculateBalanceWithRequest = async (
  employeeId: string, 
  requestDays: number,
  year?: number
): Promise<{ before: number; after: number }> => {
  const balance = await calculateLeaveBalance(employeeId, year);
  
  return {
    before: balance.remainingApproved,
    after: balance.remainingApproved - requestDays
  };
};
