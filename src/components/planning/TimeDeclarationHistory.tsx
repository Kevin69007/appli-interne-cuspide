import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format, subDays } from "date-fns";
import { Eye, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TimeDeclarationDetailsDialog } from "./TimeDeclarationDetailsDialog";
import { cn } from "@/lib/utils";

interface Declaration {
  id: string;
  date: string;
  heures: number;
  taux_activite: number;
  justification_requise: boolean;
  raison_ecart: string | null;
  details_justification: any;
  ecart_totalement_justifie: boolean;
}

export const TimeDeclarationHistory = () => {
  const { t } = useTranslation('planning');
  const { user } = useAuth();
  
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchDeclarations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return;

      const { data, error } = await supabase
        .from('pointage')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setDeclarations(data || []);
    } catch (error) {
      console.error('Error fetching declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeclarations();
  }, [user]);

  const getHoursColor = (hours: number) => {
    if (hours >= 6.5) return 'bg-green-500';
    if (hours >= 6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getActivityColor = (rate: number) => {
    if (rate > 70) return 'bg-green-500';
    if (rate >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleViewDetails = (declaration: Declaration) => {
    setSelectedDeclaration(declaration);
    setDetailsOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('timeDeclaration.history.title')}</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="start-date" className="text-xs">{t('timeDeclaration.history.startDate')}</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="end-date" className="text-xs">{t('timeDeclaration.history.endDate')}</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchDeclarations} size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {t('timeDeclaration.history.filter')}
                </Button>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">{t('timeDeclaration.history.loading')}</p>
          ) : declarations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('timeDeclaration.history.noData')}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('timeDeclaration.date')}</TableHead>
                    <TableHead>{t('timeDeclaration.history.hours')}</TableHead>
                    <TableHead>{t('timeDeclaration.history.activity')}</TableHead>
                    <TableHead>{t('timeDeclaration.history.status')}</TableHead>
                    <TableHead className="text-right">{t('timeDeclaration.history.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declarations.map((declaration) => (
                    <TableRow key={declaration.id}>
                      <TableCell className="font-medium">
                        {format(new Date(declaration.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getHoursColor(declaration.heures))} />
                          {declaration.heures}h
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getActivityColor(declaration.taux_activite))} />
                          {declaration.taux_activite}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {declaration.justification_requise ? (
                          <Badge variant={declaration.ecart_totalement_justifie ? "secondary" : "destructive"}>
                            {declaration.ecart_totalement_justifie 
                              ? t('timeDeclaration.history.justified')
                              : t('timeDeclaration.history.notJustified')}
                          </Badge>
                        ) : (
                          <Badge variant="outline">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(declaration)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('timeDeclaration.history.viewDetails')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDeclaration && (
        <TimeDeclarationDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          declaration={selectedDeclaration}
        />
      )}
    </>
  );
};
