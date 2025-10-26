import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Truck, PackageCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { OrderDetailsDialog } from "./OrderDetailsDialog";

interface OrderCardProps {
  order: any;
}

export const OrderCard = ({ order }: OrderCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <Badge variant="outline">Brouillon</Badge>,
      pending_validation: <Badge className="bg-orange-500">En attente validation</Badge>,
      validated: <Badge className="bg-red-500">À passer</Badge>,
      ordered: <Badge className="bg-yellow-500">En attente livraison</Badge>,
      delivered: <Badge className="bg-green-500">Livrée</Badge>,
      archived: <Badge variant="outline">Archivée</Badge>,
      rejected: <Badge variant="destructive">Rejetée</Badge>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetails(true)}>
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <p className="font-semibold">{order.order_number}</p>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Fournisseur: {order.supplier?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Créée le {format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })} par{" "}
              {order.created_by_employee?.prenom} {order.created_by_employee?.nom}
            </p>
            {order.total_amount && (
              <p className="text-sm font-medium">
                Montant: {order.total_amount.toFixed(2)} €
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowDetails(true)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <OrderDetailsDialog
        order={order}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
};
