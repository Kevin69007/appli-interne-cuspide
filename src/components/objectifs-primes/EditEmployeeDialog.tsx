import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  onEmployeeUpdated: () => void;
}

export const EditEmployeeDialog = ({ open, onOpenChange, employeeId, onEmployeeUpdated }: EditEmployeeDialogProps) => {
  const { t } = useTranslation('rh');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    poste: "",
    email: "",
    role: "user" as "user" | "manager" | "admin",
    is_remote: false
  });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (open && employeeId) {
      fetchEmployeeData();
    }
  }, [open, employeeId]);

  const fetchEmployeeData = async () => {
    try {
      // Fetch employee data including email and is_remote
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*, user_id")
        .eq("id", employeeId)
        .single();

      if (empError) throw empError;

      // Fetch user role
      let role = "user";
      if (empData.user_id) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", empData.user_id);

        if (roleData && roleData.length > 0) {
          const roles = roleData.map(r => r.role);
          if (roles.includes("admin")) {
            role = "admin";
          } else if (roles.includes("manager")) {
            role = "manager";
          }
        }
      }

      setFormData({
        nom: empData.nom,
        prenom: empData.prenom,
        poste: empData.poste || "",
        email: empData.email || "",
        role: role as "user" | "manager" | "admin",
        is_remote: empData.is_remote || false
      });
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Erreur lors du chargement des données");
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update employee info
      const { error: empError } = await supabase
        .from("employees")
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          poste: formData.poste,
          is_remote: formData.is_remote
        })
        .eq("id", employeeId);

      if (empError) throw empError;

      // Update role if changed
      const { data: empData } = await supabase
        .from("employees")
        .select("user_id")
        .eq("id", employeeId)
        .single();

      if (empData?.user_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: formData.role })
          .eq("user_id", empData.user_id);

        if (roleError) throw roleError;
      }

      toast.success("Informations mises à jour avec succès");
      onEmployeeUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const { data: empData } = await supabase
        .from("employees")
        .select("user_id")
        .eq("id", employeeId)
        .single();

      if (!empData?.user_id) throw new Error("User ID not found");

      const { error } = await supabase.auth.admin.updateUserById(
        empData.user_id,
        { password: newPassword }
      );

      if (error) throw error;

      toast.success("Mot de passe modifié avec succès");
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Erreur lors de la modification du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'employé</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="password">Mot de passe</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="poste">Poste</Label>
                <Input
                  id="poste"
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email (lecture seule)</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "user" | "manager" | "admin") => 
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Collaborateur</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit_is_remote">{t('isRemote')}</Label>
                <Switch
                  id="edit_is_remote"
                  checked={formData.is_remote}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked })}
                />
              </div>
              {formData.is_remote && (
                <p className="text-sm text-muted-foreground">
                  {t('isRemoteDescription')}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Modifier le mot de passe
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
