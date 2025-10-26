import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Truck, PackageCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderDetailsDialogProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetailsDialog = ({ order, open, onOpenChange }: OrderDetailsDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { role, isManager } = useUserRole();
  const [orderMethod, setOrderMethod] = useState<"email" | "phone" | "platform" | "other">("email");
  const [deliveryDelay, setDeliveryDelay] = useState<string>("48h");
  const [rejectionReason, setRejectionReason] = useState("");

  const validateOrder = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "validated",
          validated_by: employee?.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Commande validée" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onOpenChange(false);
    },
  });

  const rejectOrder = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "rejected",
          validated_by: employee?.id,
          validated_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Commande rejetée" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onOpenChange(false);
    },
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const delays = {
        "24h": 1,
        "48h": 2,
        "72h": 3,
        "1week": 7,
        "1month": 30,
      };

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + delays[deliveryDelay as keyof typeof delays]);

      const { error } = await supabase
        .from("orders")
        .update({
          status: "ordered",
          order_method: orderMethod,
          order_placed_at: new Date().toISOString(),
          order_placed_by: employee?.id,
          expected_delivery_date: expectedDate.toISOString().split("T")[0],
        })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Commande passée" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onOpenChange(false);
    },
  });

  const confirmDelivery = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
          delivered_by: employee?.id,
        })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Livraison confirmée",
        description: "Le stock a été mis à jour automatiquement",
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["product-references"] });
      onOpenChange(false);
    },
  });

  const archiveOrder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "archived" })
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Commande archivée" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Commande {order.order_number}
            {order.status === "draft" && <Badge variant="outline">Brouillon</Badge>}
            {order.status === "pending_validation" && <Badge className="bg-orange-500">En attente validation</Badge>}
            {order.status === "validated" && <Badge className="bg-red-500">À passer</Badge>}
            {order.status === "ordered" && <Badge className="bg-yellow-500">En attente livraison</Badge>}
            {order.status === "delivered" && <Badge className="bg-green-500">Livrée</Badge>}
            {order.status === "archived" && <Badge variant="outline">Archivée</Badge>}
            {order.status === "rejected" && <Badge variant="destructive">Rejetée</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold">Suivi de la commande</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  {order.validated_at && <div className="h-full w-px bg-border mt-2" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Commande créée</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    par {order.created_by_employee?.prenom} {order.created_by_employee?.nom}
                  </p>
                </div>
              </div>

              {order.validated_at && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    {order.order_placed_at && <div className="h-full w-px bg-border mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Commande validée</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.validated_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}

              {order.order_placed_at && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-white" />
                    </div>
                    {order.delivered_at && <div className="h-full w-px bg-border mt-2" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Commande passée ({order.order_method})</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.order_placed_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                    {order.expected_delivery_date && (
                      <p className="text-sm text-muted-foreground">
                        Livraison prévue le {format(new Date(order.expected_delivery_date), "dd MMM yyyy", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {order.delivered_at && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <PackageCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Livraison confirmée</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.delivered_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t my-4" />

          {/* Order details */}
          <div>
            <h3 className="font-semibold mb-3">Détails de la commande</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fournisseur:</span>
                <span className="font-medium">{order.supplier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{format(new Date(order.order_date), "dd MMM yyyy", { locale: fr })}</span>
              </div>
              {order.total_amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant total:</span>
                  <span className="font-bold">{order.total_amount.toFixed(2)} €</span>
                </div>
              )}
            </div>
          </div>

          {order.comments && (
            <div>
              <h3 className="font-semibold mb-2">Commentaires</h3>
              <p className="text-sm text-muted-foreground">{order.comments}</p>
            </div>
          )}

          {/* Order items */}
          {order.order_items && order.order_items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Articles</h3>
              <div className="space-y-2">
                {order.order_items.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.product_reference?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Réf: {item.product_reference?.reference_code}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qté: {item.quantity}</p>
                          {item.unit_price && (
                            <p className="text-sm text-muted-foreground">
                              {item.unit_price.toFixed(2)} € / unité
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="border-t my-4" />

          {/* Actions */}
          <div className="space-y-4">
            {order.status === "pending_validation" && isManager && (
              <div className="space-y-3">
                <Button 
                  onClick={() => validateOrder.mutate()} 
                  disabled={validateOrder.isPending}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider la commande
                </Button>
                <div className="space-y-2">
                  <Label>Raison du rejet</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquer pourquoi cette commande est rejetée..."
                  />
                  <Button 
                    variant="destructive"
                    onClick={() => rejectOrder.mutate()} 
                    disabled={rejectOrder.isPending || !rejectionReason}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter la commande
                  </Button>
                </div>
              </div>
            )}

            {order.status === "validated" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mode de commande</Label>
                    <Select value={orderMethod} onValueChange={(v) => setOrderMethod(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Téléphone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="platform">Plateforme</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Délai de livraison estimé</Label>
                    <Select value={deliveryDelay} onValueChange={setDeliveryDelay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h</SelectItem>
                        <SelectItem value="48h">48h</SelectItem>
                        <SelectItem value="72h">72h</SelectItem>
                        <SelectItem value="1week">1 semaine</SelectItem>
                        <SelectItem value="1month">1 mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={() => placeOrder.mutate()} 
                  disabled={placeOrder.isPending}
                  className="w-full"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Marquer comme "Commande passée"
                </Button>
              </div>
            )}

            {order.status === "ordered" && (
              <Button 
                onClick={() => confirmDelivery.mutate()} 
                disabled={confirmDelivery.isPending}
                className="w-full"
              >
                <PackageCheck className="h-4 w-4 mr-2" />
                Confirmer la réception
              </Button>
            )}

            {order.status === "delivered" && (
              <Button 
                onClick={() => archiveOrder.mutate()} 
                disabled={archiveOrder.isPending}
                variant="outline"
                className="w-full"
              >
                Archiver la commande
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
