import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, CheckCircle2, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Indicator {
  id: string;
  date: string;
  detail: string;
  valeur_declaree: number | null;
  statut_validation: string;
  points_indicateur: number | null;
}

interface Props {
  employeeId: string;
}

export const EmployeeObjectivesWidget = ({ employeeId }: Props) => {
  const [objectives, setObjectives] = useState<Indicator[]>([]);
  const [declaringObjectiveId, setDeclaringObjectiveId] = useState<string | null>(null);
  const [valeurDeclaree, setValeurDeclaree] = useState("");
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchObjectives();
  }, [employeeId]);

  const fetchObjectives = async () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('agenda_entries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('categorie', 'indicateurs' as any)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching objectives:', error);
      setLoading(false);
      return;
    }

    setObjectives((data as any) || []);
    setLoading(false);
  };

  const handleQuickDeclare = async (objectiveId: string) => {
    if (!valeurDeclaree) {
      toast.error("Veuillez entrer une valeur");
      return;
    }

    try {
      // Mise à jour optimiste : retirer l'indicateur immédiatement de l'état local
      setObjectives(prev => prev.map(obj =>
        obj.id === objectiveId 
          ? { ...obj, valeur_declaree: parseFloat(valeurDeclaree), statut_validation: 'en_attente' }
          : obj
      ));

      const { error } = await supabase
        .from('agenda_entries')
        .update({
          valeur_declaree: parseFloat(valeurDeclaree),
          statut_validation: 'en_attente'
        })
        .eq('id', objectiveId);

      if (error) throw error;

      toast.success("Indicateur déclaré ! En attente de validation.");
      setDeclaringObjectiveId(null);
      setValeurDeclaree("");
      
      // Rafraîchir depuis la DB pour confirmer
      await fetchObjectives();
    } catch (error) {
      console.error('Error declaring objective:', error);
      toast.error("Erreur lors de la déclaration");
      // En cas d'erreur, re-fetch pour restaurer l'état correct
      await fetchObjectives();
    }
  };

  const getObjectiveData = (detail: string) => {
    try {
      const parsed = JSON.parse(detail);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      return null;
    }
  };

  const categorizeObjectives = () => {
    const overdue: Indicator[] = [];
    const todayObjs: Indicator[] = [];
    const upcoming: Indicator[] = [];
    const pending: Indicator[] = [];
    const validated: Indicator[] = [];

    objectives.forEach(obj => {
      if (obj.statut_validation === 'valide') {
        validated.push(obj);
      } else if (obj.valeur_declaree !== null && obj.statut_validation === 'en_attente') {
        pending.push(obj);
      } else if (obj.valeur_declaree === null) {
        if (obj.date < today) {
          overdue.push(obj);
        } else if (obj.date === today) {
          todayObjs.push(obj);
        } else {
          upcoming.push(obj);
        }
      }
    });

    return { overdue, todayObjs, upcoming, pending, validated };
  };

  if (loading) return null;

  const { overdue, todayObjs, upcoming, pending, validated } = categorizeObjectives();

  const ObjectiveItem = ({ obj, variant }: { obj: Indicator; variant: 'overdue' | 'today' | 'upcoming' | 'pending' | 'validated' }) => {
    const data = getObjectiveData(obj.detail);
    const isExpanded = declaringObjectiveId === obj.id;
    const canDeclare = obj.date <= today; // Vérification de date

    return (
      <div className={cn(
        "p-3 border rounded-lg",
        variant === 'overdue' && "border-red-200 bg-red-50/50",
        variant === 'today' && "border-orange-200 bg-orange-50/50",
        variant === 'pending' && "border-blue-200 bg-blue-50/50",
        variant === 'validated' && "border-green-200 bg-green-50/50"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-sm">{data?.nom || obj.detail}</p>
            <p className="text-xs text-muted-foreground mt-1">
              📅 {new Date(obj.date).toLocaleDateString('fr-FR')}
              {data?.valeur_cible && ` • Cible: ${data.valeur_cible} ${data.indicateur || ''}`}
            </p>
          </div>
          
          {/* Afficher le bouton uniquement si l'indicateur peut être déclaré */}
          {variant !== 'validated' && variant !== 'pending' && canDeclare && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDeclaringObjectiveId(isExpanded ? null : obj.id)}
            >
              {isExpanded ? <X className="h-3 w-3" /> : "Déclarer"}
            </Button>
          )}
          
          {/* Badge pour les indicateurs futurs */}
          {variant === 'upcoming' && !canDeclare && (
            <Badge variant="secondary" className="text-xs">
              🔒 Pas encore disponible
            </Badge>
          )}
          
          {variant === 'pending' && (
            <Badge variant="secondary" className="text-xs">⏳ En attente</Badge>
          )}
          {variant === 'validated' && (
            <Badge variant="default" className="text-xs bg-green-600">
              ✓ +{obj.points_indicateur}pts
            </Badge>
          )}
        </div>
        
        {isExpanded && canDeclare && (
          <div className="mt-3 pt-3 border-t flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder={data?.valeur_cible || "Valeur réalisée"}
              value={valeurDeclaree}
              onChange={(e) => setValeurDeclaree(e.target.value)}
              className="h-8 text-sm"
            />
            <Button 
              size="sm" 
              onClick={() => handleQuickDeclare(obj.id)}
              className="h-8"
            >
              ✓ Valider
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {overdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-semibold text-sm text-red-600">EN RETARD ({overdue.length})</h4>
            </div>
            <div className="space-y-2">
              {overdue.map(obj => <ObjectiveItem key={obj.id} obj={obj} variant="overdue" />)}
            </div>
          </div>
        )}

        {todayObjs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-orange-600" />
              <h4 className="font-semibold text-sm text-orange-600">AUJOURD'HUI ({todayObjs.length})</h4>
            </div>
            <div className="space-y-2">
              {todayObjs.map(obj => <ObjectiveItem key={obj.id} obj={obj} variant="today" />)}
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm text-blue-600">EN ATTENTE DE VALIDATION ({pending.length})</h4>
            </div>
            <div className="space-y-2">
              {pending.map(obj => <ObjectiveItem key={obj.id} obj={obj} variant="pending" />)}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm text-muted-foreground">À VENIR ({upcoming.length})</h4>
            </div>
            <div className="space-y-2">
              {upcoming.slice(0, 3).map(obj => <ObjectiveItem key={obj.id} obj={obj} variant="upcoming" />)}
            </div>
            {upcoming.length > 3 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                + {upcoming.length - 3} autres indicateurs à venir
              </p>
            )}
          </div>
        )}

        {validated.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm text-green-600">VALIDÉS ({validated.length})</h4>
            </div>
            <div className="space-y-2">
              {validated.slice(0, 2).map(obj => <ObjectiveItem key={obj.id} obj={obj} variant="validated" />)}
            </div>
            {validated.length > 2 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                + {validated.length - 2} autres indicateurs validés
              </p>
            )}
          </div>
        )}

        {objectives.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucun indicateur pour ce mois</p>
          </div>
        )}
      </div>
    </Card>
  );
};