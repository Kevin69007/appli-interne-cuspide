import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateOrderDialog = ({ open, onOpenChange }: CreateOrderDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [comments, setComments] = useState("");
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; notes: string }>>([
    { productId: "", quantity: 1, notes: "" },
  ]);

  const { data: currentEmployee } = useQuery({
    queryKey: ["current-employee"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products", supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from("product_references")
        .select("*")
        .eq("supplier_id", supplierId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  const { data: validationConfig } = useQuery({
    queryKey: ["validation-config", currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee?.id) return null;

      const { data, error } = await supabase
        .from("user_validation_config")
        .select("*")
        .eq("employee_id", currentEmployee.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!currentEmployee?.id,
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!currentEmployee?.id || !supplierId) {
        throw new Error("Données manquantes");
      }

      const validItems = items.filter(item => item.productId && item.quantity > 0);
      if (validItems.length === 0) {
        throw new Error("Ajoutez au moins un article à la commande");
      }

      // Calculate total amount
      const productsData = await Promise.all(
        validItems.map(async (item) => {
          const product = products?.find(p => p.id === item.productId);
          return {
            ...item,
            unit_price: product?.unit_price || 0,
          };
        })
      );

      const totalAmount = productsData.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity), 
        0
      );

      // Determine status based on validation mode
      const validationMode = validationConfig?.validation_mode || "manual";
      const status = validationMode === "auto" ? "validated" : "pending_validation";

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          supplier_id: supplierId,
          created_by: currentEmployee.id,
          order_date: orderDate,
          total_amount: totalAmount,
          status,
          validation_mode: validationMode,
          comments,
          validated_by: validationMode === "auto" ? currentEmployee.id : null,
          validated_at: validationMode === "auto" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          validItems.map((item) => ({
            order_id: order.id,
            product_reference_id: item.productId,
            quantity: item.quantity,
            unit_price: productsData.find(p => p.productId === item.productId)?.unit_price || 0,
            notes: item.notes,
          }))
        );

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      toast({
        title: "Commande créée",
        description: "La commande a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onOpenChange(false);
      // Reset form
      setSupplierId("");
      setComments("");
      setItems([{ productId: "", quantity: 1, notes: "" }]);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, notes: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle commande</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fournisseur *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de commande</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Articles</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5 space-y-2">
                  <Label className="text-xs">Référence</Label>
                  <Select
                    value={item.productId}
                    onValueChange={(value) => updateItem(index, "productId", value)}
                    disabled={!supplierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.reference_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                  />
                </div>

                <div className="col-span-4 space-y-2">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={item.notes}
                    onChange={(e) => updateItem(index, "notes", e.target.value)}
                    placeholder="Notes..."
                  />
                </div>

                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Commentaires</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Commentaires sur la commande..."
              rows={3}
            />
          </div>

          {validationConfig?.validation_mode === "auto" && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Cette commande sera validée automatiquement
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={() => createOrder.mutate()} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Création..." : "Créer la commande"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
