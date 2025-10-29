import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Gift, Trash2, Edit } from "lucide-react";

interface Reward {
  id: string;
  titre: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  is_active: boolean;
}

interface Redemption {
  id: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
  employee: {
    nom: string;
    prenom: string;
  };
  reward: {
    titre: string;
  };
}

export const RewardCatalogAdmin = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    points_required: 100,
    image_url: "",
    is_active: true
  });

  useEffect(() => {
    fetchRewards();
    fetchRedemptions();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_catalog')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error("Erreur lors du chargement du catalogue");
    } finally {
      setLoading(false);
    }
  };

  const fetchRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          employee:employees(nom, prenom),
          reward:reward_catalog(titre)
        `)
        .order('redeemed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingReward) {
        const { error } = await supabase
          .from('reward_catalog')
          .update(formData)
          .eq('id', editingReward.id);

        if (error) throw error;
        toast.success("Récompense mise à jour");
      } else {
        const { error } = await supabase
          .from('reward_catalog')
          .insert([formData]);

        if (error) throw error;
        toast.success("Récompense créée");
      }

      setDialogOpen(false);
      setEditingReward(null);
      setFormData({
        titre: "",
        description: "",
        points_required: 100,
        image_url: "",
        is_active: true
      });
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      titre: reward.titre,
      description: reward.description || "",
      points_required: reward.points_required,
      image_url: reward.image_url || "",
      is_active: reward.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette récompense ?")) return;

    try {
      const { error } = await supabase
        .from('reward_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Récompense supprimée");
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('reward_catalog')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchRewards();
    } catch (error) {
      console.error('Error toggling reward:', error);
      toast.error("Erreur lors de la modification");
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Catalogue de récompenses</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReward(null); setFormData({ titre: "", description: "", points_required: 100, image_url: "", is_active: true }); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle récompense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingReward ? "Modifier la récompense" : "Nouvelle récompense"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Titre *</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points requis *</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_required: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">URL image</Label>
                <Input
                  id="image"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Récompense active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingReward ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className={!reward.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{reward.titre}</CardTitle>
                <Badge variant={reward.is_active ? "default" : "secondary"}>
                  {reward.points_required} pts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                {reward.description || "Aucune description"}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(reward)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(reward.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Switch
                  checked={reward.is_active}
                  onCheckedChange={(checked) => handleToggleActive(reward.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Historique des échanges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Récompense</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucun échange pour le moment
                  </TableCell>
                </TableRow>
              ) : (
                redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>
                      {redemption.employee.prenom} {redemption.employee.nom}
                    </TableCell>
                    <TableCell>{redemption.reward.titre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{redemption.points_spent} pts</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(redemption.redeemed_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={redemption.status === 'delivered' ? 'default' : 'secondary'}>
                        {redemption.status === 'delivered' ? 'Livré' : 'En attente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
