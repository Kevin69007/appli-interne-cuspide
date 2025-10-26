import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const StockView = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["product-references"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_references")
        .select(`
          *,
          category:product_categories(name),
          supplier:suppliers(name),
          pending_orders:orders!inner(
            id,
            status,
            order_items!inner(
              quantity
            )
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // Calculate pending quantities
      return data.map((product) => {
        const pendingQty = product.pending_orders
          ?.filter((order: any) => ["validated", "ordered"].includes(order.status))
          ?.reduce((sum: number, order: any) => {
            const itemQty = order.order_items
              ?.filter((item: any) => item.product_reference_id === product.id)
              ?.reduce((s: number, item: any) => s + item.quantity, 0) || 0;
            return sum + itemQty;
          }, 0) || 0;

        return {
          ...product,
          pending_quantity: pendingQty,
        };
      });
    },
  });

  const alertProducts = products?.filter(
    (p) => p.current_stock <= p.alert_threshold && p.alert_threshold > 0
  ) || [];

  const lowStockProducts = products?.filter(
    (p) => p.current_stock > 0 && p.current_stock <= p.minimum_order_quantity
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion du stock</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble des niveaux de stock
          </p>
        </div>
      </div>

      {/* Alerts */}
      {alertProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Alertes stock ({alertProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-background rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name} • {product.supplier?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {product.current_stock} unités
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seuil: {product.alert_threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock complet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead className="text-right">Stock actuel</TableHead>
                    <TableHead className="text-right">En commande</TableHead>
                    <TableHead className="text-right">Stock total</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => {
                    const totalStock = product.current_stock + product.pending_quantity;
                    const isAlert = product.current_stock <= product.alert_threshold && product.alert_threshold > 0;
                    const isLow = !isAlert && product.current_stock > 0 && product.current_stock <= product.minimum_order_quantity;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">
                          {product.reference_code}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category?.name || "-"}</TableCell>
                        <TableCell>{product.supplier?.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.current_stock}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.pending_quantity > 0 ? (
                            <Badge variant="outline" className="bg-yellow-50">
                              +{product.pending_quantity}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {totalStock}
                        </TableCell>
                        <TableCell>
                          {isAlert ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Critique
                            </Badge>
                          ) : isLow ? (
                            <Badge className="bg-orange-500 gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Faible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
