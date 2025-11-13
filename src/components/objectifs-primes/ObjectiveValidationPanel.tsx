import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface PendingObjective {
  id: string;
  date: string;
  detail: string;
  valeur_declaree: number;
  commentaire_validation: string | null;
  raison_ecart: string | null;
  detail_probleme: string | null;
  manager_notifie: boolean;
  employee: {
    nom: string;
    prenom: string;
  };
}

export const ObjectiveValidationPanel = () => {
  const [pendingObjectives, setPendingObjectives] = useState<PendingObjective[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<PendingObjective | null>(null);
  const [valeurControlee, setValeurControlee] = useState("");
  const [commentaireValidation, setCommentaireValidation] = useState("");
  const [loading, setLoading] = useState(false);
  const [toleranceConfig, setToleranceConfig] = useState<any>(null);

  useEffect(() => {
    fetchPendingObjectives();
    fetchToleranceConfig();
  }, []);

  const fetchToleranceConfig = async () => {
    const { data } = await supabase
      .from('configuration')
      .select('valeur')
      .eq('cle', 'auto_declaration_tolerance_tiers')
      .single();

    if (data) {
      setToleranceConfig(data.valeur);
    }
  };

  const fetchPendingObjectives = async () => {
    const { data, error } = await supabase
      .from('agenda_entries')
      .select(`
        *,
        employee:employees(nom, prenom)
      `)
      .eq('categorie', 'indicateurs' as any)
      .eq('statut_validation', 'en_attente')
      .not('valeur_declaree', 'is', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching pending objectives:', error);
      return;
    }

    setPendingObjectives((data as any) || []);
  };

  const calculateDiscrepancy = (declared: number, controlled: number): number => {
    if (declared === 0) return 0;
    return Math.abs(((declared - controlled) / declared) * 100);
  };

  const getMalusPoints = (discrepancy: number): number => {
    if (!toleranceConfig) return 0;

    if (discrepancy <= toleranceConfig.faible) return 0;
    if (discrepancy <= toleranceConfig.moyen) return -5;
    return -10;
  };

  const handleValidate = async () => {
    if (!selectedObjective || !valeurControlee) {
      toast.error("Veuillez entrer la valeur contrôlée");
      return;
    }

    setLoading(true);

    try {
      const controlled = parseFloat(valeurControlee);
      const discrepancy = calculateDiscrepancy(selectedObjective.valeur_declaree, controlled);
      const malusPoints = getMalusPoints(discrepancy);

      // Extraire l'objectif du JSON
      let objectiveData: any = null;
      try {
        const parsed = JSON.parse(selectedObjective.detail);
        objectiveData = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch (e) {
        throw new Error("Format d'objectif invalide");
      }

      // Calculer les points de l'indicateur (proportionnel à la valeur contrôlée)
      const pointsIndicateur = objectiveData.valeur_cible > 0
        ? Math.round((controlled / objectiveData.valeur_cible) * (objectiveData.points_indicateur || 0))
        : 0;

      // Mettre à jour l'entrée agenda avec la valeur contrôlée
      const { error: updateError } = await supabase
        .from('agenda_entries')
        .update({
          valeur_controlee: controlled,
          ecart_pourcentage: discrepancy,
          points_indicateur: pointsIndicateur,
          statut_validation: 'valide',
          commentaire_validation: commentaireValidation || null,
          date_validation: new Date().toISOString()
        })
        .eq('id', selectedObjective.id);

      if (updateError) throw updateError;

      // Si malus, créer une entrée séparée
      if (malusPoints < 0) {
        const { error: malusError } = await supabase
          .from('agenda_entries')
          .insert({
            employee_id: (selectedObjective as any).employee_id,
            date: selectedObjective.date,
            categorie: 'incident',
            type_incident: 'erreur_protocole',
            gravite: discrepancy > toleranceConfig.moyen ? 'majeure' : 'moyenne',
            detail: `Écart de ${discrepancy.toFixed(1)}% sur déclaration objectif`,
            points: malusPoints,
            statut_validation: 'valide'
          });

        if (malusError) throw malusError;
      }

      toast.success(
        malusPoints < 0
          ? `Indicateur validé avec un écart de ${discrepancy.toFixed(1)}%. Malus de ${malusPoints} pts appliqué.`
          : `Indicateur validé ! +${pointsIndicateur} pts`
      );

      setSelectedObjective(null);
      setValeurControlee("");
      setCommentaireValidation("");
      fetchPendingObjectives();
    } catch (error) {
      console.error('Error validating objective:', error);
      toast.error("Erreur lors de la validation");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedObjective) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('agenda_entries')
        .update({
          statut_validation: 'refuse',
          commentaire_validation: commentaireValidation || "Objectif rejeté",
          date_validation: new Date().toISOString()
        })
        .eq('id', selectedObjective.id);

      if (error) throw error;

      toast.success("Objectif rejeté");
      setSelectedObjective(null);
      setCommentaireValidation("");
      fetchPendingObjectives();
    } catch (error) {
      console.error('Error rejecting objective:', error);
      toast.error("Erreur lors du rejet");
    } finally {
      setLoading(false);
    }
  };

  const discrepancy = selectedObjective && valeurControlee
    ? calculateDiscrepancy(selectedObjective.valeur_declaree, parseFloat(valeurControlee))
    : 0;

  const malusPoints = getMalusPoints(discrepancy);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Objectifs en attente de validation</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingObjectives.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun indicateur en attente de validation
            </p>
          ) : (
            <div className="space-y-3">
              {pendingObjectives.map((obj) => {
                let objectiveData: any = null;
                try {
                  const parsed = JSON.parse(obj.detail);
                  objectiveData = Array.isArray(parsed) ? parsed[0] : parsed;
                } catch (e) {
                  objectiveData = null;
                }

                return (
                  <div key={obj.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">
                        {obj.employee.prenom} {obj.employee.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {objectiveData?.nom || "Indicateur"} - {new Date(obj.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm">
                        Déclaré: <strong>{obj.valeur_declaree}</strong> {objectiveData?.indicateur}
                      </p>
                    </div>
                    <Button onClick={() => setSelectedObjective(obj)} size="sm">
                      Valider
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedObjective} onOpenChange={() => setSelectedObjective(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Validation d'indicateur</DialogTitle>
          </DialogHeader>
          {selectedObjective && (() => {
            let objectiveData: any = null;
            try {
              const parsed = JSON.parse(selectedObjective.detail);
              objectiveData = Array.isArray(parsed) ? parsed[0] : parsed;
            } catch (e) {
              objectiveData = null;
            }

            return (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p><strong>Employé:</strong> {selectedObjective.employee.prenom} {selectedObjective.employee.nom}</p>
                  <p><strong>Indicateur:</strong> {objectiveData?.nom}</p>
                  <p><strong>Cible:</strong> {objectiveData?.valeur_cible} {objectiveData?.indicateur}</p>
                  <p><strong>Déclaré:</strong> {selectedObjective.valeur_declaree} {objectiveData?.indicateur}</p>
                  {selectedObjective.commentaire_validation && (
                    <p><strong>Commentaire:</strong> {selectedObjective.commentaire_validation}</p>
                  )}
                </div>

                {selectedObjective.raison_ecart && (
                  <div className="space-y-2 border-l-4 border-orange-500 pl-4 py-2 bg-orange-50">
                    <h4 className="font-semibold text-orange-700">Justification de l'écart :</h4>
                    <p className="text-sm">
                      <strong>Raison :</strong>{' '}
                      {selectedObjective.raison_ecart === 'indicateur_trop_eleve' && 'Indicateur trop élevé'}
                      {selectedObjective.raison_ecart === 'volume_travail_insuffisant' && 'Volume de travail insuffisant'}
                      {selectedObjective.raison_ecart === 'probleme_exceptionnel' && 'Problème exceptionnel'}
                    </p>
                    {selectedObjective.detail_probleme && (
                      <p className="text-sm">
                        <strong>Détails :</strong> {selectedObjective.detail_probleme}
                      </p>
                    )}
                    {selectedObjective.manager_notifie && (
                      <Badge variant="outline" className="mt-2">
                        ✓ Manager notifié
                      </Badge>
                    )}
                  </div>
                )}

                <div>
                  <Label>Valeur contrôlée *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valeurControlee}
                    onChange={(e) => setValeurControlee(e.target.value)}
                    placeholder="Entrer la valeur réelle"
                  />
                </div>

                {valeurControlee && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {discrepancy === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : malusPoints < 0 ? (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      <span className="font-semibold">
                        Écart: {discrepancy.toFixed(1)}%
                      </span>
                    </div>
                    {malusPoints < 0 && (
                      <p className="text-sm text-orange-600">
                        ⚠️ Un malus de {malusPoints} pts sera appliqué
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label>Commentaire (optionnel)</Label>
                  <Textarea
                    value={commentaireValidation}
                    onChange={(e) => setCommentaireValidation(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={loading}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    onClick={handleValidate}
                    disabled={loading || !valeurControlee}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Valider
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};
