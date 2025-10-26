import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: any;
}

export const CreateSupplierDialog = ({ open, onOpenChange, supplier }: CreateSupplierDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");
  const [autoEmailOnOrder, setAutoEmailOnOrder] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || "");
      setContactEmail(supplier.contact_email || "");
      setContactPhone(supplier.contact_phone || "");
      setResponsibleEmployeeId(supplier.responsible_employee_id || "");
      setAutoEmailOnOrder(supplier.auto_email_on_order || false);
      setNotes(supplier.notes || "");
    } else {
      setName("");
      setContactEmail("");
      setContactPhone("");
      setResponsibleEmployeeId("");
      setAutoEmailOnOrder(false);
      setNotes("");
    }
  }, [supplier, open]);

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("nom");

      if (error) throw error;
      return data;
    },
  });

  const saveSupplier = useMutation({
    mutationFn: async () => {
      if (!name || !responsibleEmployeeId) {
        throw new Error("Le nom et le responsable sont obligatoires");
      }

      const supplierData = {
        name,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        responsible_employee_id: responsibleEmployeeId,
        auto_email_on_order: autoEmailOnOrder,
        notes: notes || null,
      };

      if (supplier) {
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", supplier.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert(supplierData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: supplier ? "Fournisseur modifié" : "Fournisseur créé",
      });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du fournisseur *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du fournisseur"
            />
          </div>

          <div className="space-y-2">
            <Label>Responsable *</Label>
            <Select value={responsibleEmployeeId} onValueChange={setResponsibleEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un responsable" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.prenom} {employee.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Le responsable recevra les tâches liées aux commandes de ce fournisseur
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email de contact</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@fournisseur.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-email"
              checked={autoEmailOnOrder}
              onCheckedChange={(checked) => setAutoEmailOnOrder(checked as boolean)}
            />
            <Label htmlFor="auto-email" className="text-sm font-normal cursor-pointer">
              Envoyer un email automatique lors de la validation d'une commande
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={() => saveSupplier.mutate()} disabled={saveSupplier.isPending}>
              {saveSupplier.isPending ? "Enregistrement..." : supplier ? "Modifier" : "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
