import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AddEmployeeDialog = ({ onEmployeeAdded }: { onEmployeeAdded?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    poste: "",
    email: "",
    password: "",
    role: "user" as "admin" | "manager" | "user"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Appeler l'edge function qui utilise les droits admin
      console.log("Calling create-employee function with:", {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        role: formData.role
      });

      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          nom: formData.nom,
          prenom: formData.prenom,
          poste: formData.poste,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }
      
      if (data?.error) {
        console.error("Function returned error:", data.error);
        toast.error(data.error);
        return;
      }

      toast.success(data?.message || "Employé ajouté avec succès");
      setFormData({ nom: "", prenom: "", poste: "", email: "", password: "", role: "user" });
      setOpen(false);
      onEmployeeAdded?.();
    } catch (error: any) {
      console.error("Error adding employee:", error);
      toast.error(error.message || "Impossible d'ajouter l'employé.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Ajouter un employé</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un employé</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="role">Rôle</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "manager" | "user") => 
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
