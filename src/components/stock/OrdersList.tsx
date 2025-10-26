import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, Archive } from "lucide-react";
import { OrderCard } from "./OrderCard";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { useUserRole } from "@/hooks/useUserRole";

export const OrdersList = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { role } = useUserRole();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", showArchived],
    queryFn: async () => {
      const query = supabase
        .from("orders")
        .select(`
          *,
          supplier:suppliers(*),
          created_by_employee:employees!orders_created_by_fkey(nom, prenom),
          order_items(
            *,
            product_reference:product_references(*)
          )
        `)
        .order("created_at", { ascending: false });

      if (!showArchived) {
        query.neq("status", "archived");
      } else {
        query.eq("status", "archived");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const groupedOrders = {
    draft: orders?.filter((o) => o.status === "draft") || [],
    pending_validation: orders?.filter((o) => o.status === "pending_validation") || [],
    validated: orders?.filter((o) => o.status === "validated") || [],
    ordered: orders?.filter((o) => o.status === "ordered") || [],
    delivered: orders?.filter((o) => o.status === "delivered") || [],
    archived: orders?.filter((o) => o.status === "archived") || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez vos commandes de la création à la livraison
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? "Commandes actives" : "Archives"}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle commande
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {!showArchived ? (
            <>
              {groupedOrders.draft.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                      Brouillons
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedOrders.draft.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {groupedOrders.pending_validation.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                      En attente de validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedOrders.pending_validation.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {groupedOrders.validated.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      Commandes à passer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedOrders.validated.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {groupedOrders.ordered.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      En attente de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedOrders.ordered.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {groupedOrders.delivered.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      Livrées
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedOrders.delivered.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {orders?.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">
                      Aucune commande en cours. Créez votre première commande.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Commandes archivées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedOrders.archived.length > 0 ? (
                  groupedOrders.archived.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune commande archivée
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreateOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
