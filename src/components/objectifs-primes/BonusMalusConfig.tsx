import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface BonusConfig {
  id: string;
  event_type: string;
  gravite: string | null;
  points: number;
  is_active: boolean;
  description: string;
}

export const BonusMalusConfig = () => {
  const [configs, setConfigs] = useState<BonusConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('bonus_malus_config')
        .select('*')
        .order('event_type', { ascending: true })
        .order('gravite', { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = (id: string, newPoints: number) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, points: newPoints } : config
    ));
  };

  const handleActiveToggle = (id: string, isActive: boolean) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, is_active: isActive } : config
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = configs.map(config => ({
        id: config.id,
        points: config.points,
        is_active: config.is_active
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('bonus_malus_config')
          .update({ points: update.points, is_active: update.is_active })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success("Configuration sauvegardée avec succès");
      fetchConfigs();
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getEventLabel = (eventType: string, gravite: string | null) => {
    const labels: Record<string, string> = {
      'incident': 'Incident',
      'retard': 'Retard',
      'erreur_protocole': 'Erreur protocole',
      'tache_a_temps': 'Tâche à temps',
      'tache_standard_retard': 'Tâche standard en retard',
      'tache_entretien_retard': 'Tâche entretien en retard',
      'participation_jeu_hebdo': 'Participation jeu hebdo',
      'absence_injustifiee': 'Absence injustifiée'
    };

    const graviteLabels: Record<string, string> = {
      'mineure': 'Mineure',
      'moyenne': 'Moyenne',
      'majeure': 'Majeure'
    };

    const base = labels[eventType] || eventType;
    return gravite ? `${base} - ${graviteLabels[gravite] || gravite}` : base;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 p-4 border-l-4 border-blue-500 bg-blue-50">
        <h4 className="font-semibold text-blue-700 mb-2">
          📌 Règle de calcul des retards
        </h4>
        <p className="text-sm text-blue-600">
          Une tâche est considérée <strong>en retard</strong> lorsque sa date d'échéance 
          est dépassée de <strong>24 heures</strong> ou plus. Les pénalités configurées 
          ci-dessous s'appliquent automatiquement à la clôture de la tâche.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Barèmes de points</h3>
          <p className="text-sm text-muted-foreground">
            Configurez les points attribués pour chaque type d'événement
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sauvegarde...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Sauvegarder</>
          )}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type d'événement</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Points</TableHead>
              <TableHead className="w-[80px]">Actif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.id}>
                <TableCell className="font-medium">
                  {getEventLabel(config.event_type, config.gravite)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {config.description}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={config.points}
                    onChange={(e) => handlePointsChange(config.id, parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => handleActiveToggle(config.id, checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
