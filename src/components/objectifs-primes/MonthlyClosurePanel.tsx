import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, AlertTriangle, CheckCircle, FileCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { closeMonth } from "@/lib/monthClosure";

interface Indicator {
  id: string;
  date: string;
  detail: string;
  valeur_declaree: number;
  valeur_controlee: number | null;
  controle_effectue: boolean;
  raison_ecart: string | null;
  detail_probleme: string | null;
  commentaire_validation: string | null;
  employee: {
    nom: string;
    prenom: string;
    equipe: string;
  };
}

export const MonthlyClosurePanel = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [valeurControlee, setValeurControlee] = useState("");
  const [commentaireControle, setCommentaireControle] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthStatus, setMonthStatus] = useState<'ouvert' | 'cloture' | 'publie'>('ouvert');
  const [controlDialogOpen, setControlDialogOpen] = useState(false);

  useEffect(() => {
    fetchIndicators();
  }, [currentMonth, currentYear]);

  const fetchIndicators = async () => {
    const firstDay = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('agenda_entries')
      .select(`
        *,
        employee:employees!inner(nom, prenom, equipe)
      `)
      .eq('categorie', 'objectifs' as any)
      .not('valeur_declaree', 'is', null)
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching indicators:', error);
      return;
    }

    setIndicators((data as any) || []);

    // Vérifier le statut du mois
    if (data && data.length > 0) {
      const { data: scoreData } = await supabase
        .from('monthly_scores')
        .select('statut')
        .eq('employee_id', data[0].employee_id)
        .eq('mois', currentMonth)
        .eq('annee', currentYear)
        .maybeSingle();

      setMonthStatus(scoreData?.statut || 'ouvert');
    }
  };

  const openControlDialog = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setValeurControlee(indicator.valeur_controlee?.toString() || "");
    setCommentaireControle(indicator.commentaire_validation || "");
    setControlDialogOpen(true);
  };

  const calculateMalus = (valeurDeclaree: number, valeurControlee: number): number => {
    const ecart = Math.abs((valeurDeclaree - valeurControlee) / valeurDeclaree) * 100;
    
    if (ecart < 10) return 0;
    if (ecart < 20) return -2;
    if (ecart < 30) return -5;
    return -10;
  };

  const handleSaveControl = async () => {
    if (!selectedIndicator) return;

    setLoading(true);
    try {
      const valeurControleeNum = valeurControlee ? parseFloat(valeurControlee) : null;
      
      // Calculer le malus si écart
      let malus = 0;
      if (valeurControleeNum !== null && valeurControleeNum !== selectedIndicator.valeur_declaree) {
        malus = calculateMalus(selectedIndicator.valeur_declaree, valeurControleeNum);
      }

      const { error } = await supabase
        .from('agenda_entries')
        .update({
          valeur_controlee: valeurControleeNum,
          commentaire_validation: commentaireControle || null,
          controle_effectue: true,
          controle_par: user?.id,
          date_controle: new Date().toISOString(),
          points: malus !== 0 ? malus : null
        })
        .eq('id', selectedIndicator.id);

      if (error) throw error;

      toast.success("Contrôle enregistré");
      setControlDialogOpen(false);
      fetchIndicators();
    } catch (error) {
      console.error('Error saving control:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await closeMonth(currentMonth, currentYear, user.id);
      toast.success(`Mois clôturé ! ${result.employeesCount} employé(s) traité(s).`);
      fetchIndicators();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la clôture");
    } finally {
      setLoading(false);
    }
  };

  const uncheckedCount = indicators.filter(i => !i.controle_effectue).length;

  return (
    <div className="space-y-6">
      {/* Sélection mois/année */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Clôture mensuelle</CardTitle>
            <div className="flex gap-2">
              <Select 
                value={currentMonth.toString()} 
                onValueChange={(v) => setCurrentMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleString('fr-FR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={currentYear.toString()} 
                onValueChange={(v) => setCurrentYear(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant={monthStatus === 'ouvert' ? 'default' : 'secondary'}>
                {monthStatus === 'ouvert' ? '🔓 Ouvert' : '🔒 Clôturé'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {indicators.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun indicateur déclaré pour ce mois
            </p>
          ) : (
            <div className="space-y-4">
              {indicators.map(indicator => {
                const indicatorData = JSON.parse(indicator.detail);
                const data = Array.isArray(indicatorData) ? indicatorData[0] : indicatorData;

                return (
                  <div 
                    key={indicator.id}
                    className={`border-l-4 p-4 rounded ${
                      indicator.controle_effectue ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">
                            {indicator.employee.prenom} {indicator.employee.nom}
                          </p>
                          <Badge variant="outline">{indicator.employee.equipe}</Badge>
                          {indicator.controle_effectue && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Contrôlé
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">
                          <strong>{data.titre}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date : {new Date(indicator.date).toLocaleDateString('fr-FR')} | 
                          Déclaré : <strong>{indicator.valeur_declaree} {data.unite}</strong> | 
                          Cible : {data.valeur_cible} {data.unite}
                        </p>
                        {indicator.valeur_controlee !== null && (
                          <p className="text-sm mt-1">
                            Valeur contrôlée : <strong className="text-orange-600">
                              {indicator.valeur_controlee} {data.unite}
                            </strong>
                          </p>
                        )}
                        {indicator.raison_ecart && (
                          <Badge variant="secondary" className="mt-2">
                            ⚠️ Justification fournie
                          </Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => openControlDialog(indicator)}
                        disabled={monthStatus === 'cloture'}
                      >
                        {indicator.controle_effectue ? 'Modifier' : 'Contrôler'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerte et bouton de clôture */}
      {indicators.length > 0 && monthStatus === 'ouvert' && (
        <Alert className="border-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {uncheckedCount > 0 ? (
                <span className="text-orange-600 font-semibold">
                  {uncheckedCount} indicateur(s) non contrôlé(s)
                </span>
              ) : (
                <span className="text-green-600 font-semibold">
                  ✓ Tous les indicateurs sont contrôlés
                </span>
              )}
            </p>
            <p className="text-sm">
              Une fois le mois clôturé, vous ne pourrez plus modifier les indicateurs.
              Les points seront finalisés et les primes calculées.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleCloseMonth}
              disabled={loading || uncheckedCount > 0}
              className="mt-2"
            >
              <Lock className="h-4 w-4 mr-2" />
              Clôturer le mois
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog de contrôle */}
      <Dialog open={controlDialogOpen} onOpenChange={setControlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contrôler l'indicateur</DialogTitle>
          </DialogHeader>
          
          {selectedIndicator && (
            <div className="space-y-4">
              {/* Infos déclaration */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p>
                  <strong>Valeur déclarée :</strong> {selectedIndicator.valeur_declaree}
                </p>
                <p>
                  <strong>Valeur cible :</strong>{" "}
                  {JSON.parse(selectedIndicator.detail).valeur_cible}
                </p>
                {selectedIndicator.raison_ecart && (
                  <div className="border-t pt-2 mt-2">
                    <Badge className="mb-2">Justification fournie</Badge>
                    <p className="text-sm"><strong>Raison :</strong> {selectedIndicator.raison_ecart}</p>
                    {selectedIndicator.detail_probleme && (
                      <p className="text-sm italic">{selectedIndicator.detail_probleme}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Saisie valeur contrôlée */}
              <div>
                <Label>Valeur contrôlée (optionnel)</Label>
                <Input
                  type="number"
                  value={valeurControlee}
                  onChange={(e) => setValeurControlee(e.target.value)}
                  placeholder="Laisser vide si valeur déclarée correcte"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ℹ️ Ne remplir que si vous constatez un écart avec la réalité
                </p>
              </div>
              
              {/* Impact pénalités */}
              {valeurControlee && parseFloat(valeurControlee) !== selectedIndicator.valeur_declaree && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Impact sur les points</AlertTitle>
                  <AlertDescription>
                    Écart constaté : {Math.abs(
                      ((selectedIndicator.valeur_declaree - parseFloat(valeurControlee)) / 
                      selectedIndicator.valeur_declaree) * 100
                    ).toFixed(1)}%<br/>
                    Pénalité : {calculateMalus(selectedIndicator.valeur_declaree, parseFloat(valeurControlee))} points
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Commentaire */}
              <div>
                <Label>Commentaire (optionnel)</Label>
                <Textarea 
                  value={commentaireControle}
                  onChange={(e) => setCommentaireControle(e.target.value)}
                  placeholder="Expliquez pourquoi vous ajustez cette valeur..."
                />
              </div>
              
              <Button onClick={handleSaveControl} disabled={loading} className="w-full">
                <FileCheck className="h-4 w-4 mr-2" />
                Enregistrer le contrôle
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
