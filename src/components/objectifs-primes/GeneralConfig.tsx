import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface ConfigValues {
  objectifs_points_total: number;
  meilleur_mois_bonus: number;
  tier1_max: number;
  tier1_malus: number;
  tier2_min: number;
  tier2_max: number;
  tier2_malus: number;
  tier3_min: number;
  tier3_malus: number;
}

export const GeneralConfig = () => {
  const [config, setConfig] = useState<ConfigValues>({
    objectifs_points_total: 100,
    meilleur_mois_bonus: 20,
    tier1_max: 10,
    tier1_malus: 0,
    tier2_min: 10,
    tier2_max: 20,
    tier2_malus: -5,
    tier3_min: 20,
    tier3_malus: -15
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuration')
        .select('*')
        .in('cle', ['objectifs_points_total', 'meilleur_mois_bonus', 'auto_declaration_tolerance_tiers']);

      if (error) throw error;

      const configMap = data?.reduce((acc, item) => {
        acc[item.cle] = item.valeur;
        return acc;
      }, {} as Record<string, any>);

      if (configMap) {
        const toleranceTiers = typeof configMap.auto_declaration_tolerance_tiers === 'string'
          ? JSON.parse(configMap.auto_declaration_tolerance_tiers)
          : configMap.auto_declaration_tolerance_tiers;

        setConfig({
          objectifs_points_total: parseInt(configMap.objectifs_points_total) || 100,
          meilleur_mois_bonus: parseInt(configMap.meilleur_mois_bonus) || 20,
          tier1_max: toleranceTiers?.tier1?.max || 10,
          tier1_malus: toleranceTiers?.tier1?.malus || 0,
          tier2_min: toleranceTiers?.tier2?.min || 10,
          tier2_max: toleranceTiers?.tier2?.max || 20,
          tier2_malus: toleranceTiers?.tier2?.malus || -5,
          tier3_min: toleranceTiers?.tier3?.min || 20,
          tier3_malus: toleranceTiers?.tier3?.malus || -15
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const toleranceTiers = {
        tier1: { min: 0, max: config.tier1_max, malus: config.tier1_malus },
        tier2: { min: config.tier2_min, max: config.tier2_max, malus: config.tier2_malus },
        tier3: { min: config.tier3_min, max: 100, malus: config.tier3_malus }
      };

      const updates = [
        { cle: 'objectifs_points_total', valeur: config.objectifs_points_total.toString() },
        { cle: 'meilleur_mois_bonus', valeur: config.meilleur_mois_bonus.toString() },
        { cle: 'auto_declaration_tolerance_tiers', valeur: JSON.stringify(toleranceTiers) }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('configuration')
          .update({ valeur: update.valeur })
          .eq('cle', update.cle);

        if (error) throw error;
      }

      toast.success("Configuration sauvegardée avec succès");
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration générale</CardTitle>
          <CardDescription>
            Paramètres globaux du système objectifs & primes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="objectifs_total">Total points objectifs</Label>
              <Input
                id="objectifs_total"
                type="number"
                value={config.objectifs_points_total}
                onChange={(e) => setConfig(prev => ({ ...prev, objectifs_points_total: parseInt(e.target.value) || 100 }))}
              />
              <p className="text-xs text-muted-foreground">
                Points totaux disponibles pour les objectifs du mois
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meilleur_bonus">Bonus meilleur du mois</Label>
              <Input
                id="meilleur_bonus"
                type="number"
                value={config.meilleur_mois_bonus}
                onChange={(e) => setConfig(prev => ({ ...prev, meilleur_mois_bonus: parseInt(e.target.value) || 20 }))}
              />
              <p className="text-xs text-muted-foreground">
                Points bonus attribués au meilleur employé du mois
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paliers auto-déclaration</CardTitle>
          <CardDescription>
            Malus appliqués selon l'écart entre valeur déclarée et contrôlée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Palier 1: 0% - {config.tier1_max}%</Label>
                <Input
                  type="number"
                  value={config.tier1_max}
                  onChange={(e) => setConfig(prev => ({ ...prev, tier1_max: parseInt(e.target.value) || 10 }))}
                  placeholder="Max %"
                />
              </div>
              <div className="space-y-2">
                <Label>Malus</Label>
                <Input
                  type="number"
                  value={config.tier1_malus}
                  onChange={(e) => setConfig(prev => ({ ...prev, tier1_malus: parseInt(e.target.value) || 0 }))}
                  placeholder="Points"
                />
              </div>
              <p className="text-xs text-muted-foreground pb-2">Écart acceptable</p>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Palier 2: {config.tier2_min}% - {config.tier2_max}%</Label>
                <Input
                  type="number"
                  value={config.tier2_max}
                  onChange={(e) => setConfig(prev => ({ ...prev, tier2_max: parseInt(e.target.value) || 20 }))}
                  placeholder="Max %"
                />
              </div>
              <div className="space-y-2">
                <Label>Malus</Label>
                <Input
                  type="number"
                  value={config.tier2_malus}
                  onChange={(e) => setConfig(prev => ({ ...prev, tier2_malus: parseInt(e.target.value) || -5 }))}
                  placeholder="Points"
                />
              </div>
              <p className="text-xs text-muted-foreground pb-2">Écart modéré</p>
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Palier 3: &gt; {config.tier3_min}%</Label>
                <Input
                  type="number"
                  value={config.tier3_min}
                  onChange={(e) => setConfig(prev => ({ ...prev, tier3_min: parseInt(e.target.value) || 20 }))}
                  placeholder="Min %"
                />
              </div>
              <div className="space-y-2">
                <Label>Malus</Label>
                <Input
                  type="number"
                  value={config.tier3_malus}
                  onChange={(e) => setConfig(prev => ({ ...prev, tier3_malus: parseInt(e.target.value) || -15 }))}
                  placeholder="Points"
                />
              </div>
              <p className="text-xs text-muted-foreground pb-2">Écart important</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sauvegarde...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Sauvegarder</>
          )}
        </Button>
      </div>
    </div>
  );
};
