import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ProductReferencesConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState("");
  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [packaging, setPackaging] = useState("");
  const [minimumOrderQty, setMinimumOrderQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("0");

  const { data: products, isLoading } = useQuery({
    queryKey: ["product-references"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_references")
        .select(`
          *,
          category:product_categories(name),
          supplier:suppliers(name)
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

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

  const saveProduct = useMutation({
    mutationFn: async () => {
      if (!referenceCode || !productName || !supplierId) {
        throw new Error("Code, nom et fournisseur obligatoires");
      }

      const productData = {
        reference_code: referenceCode,
        name: productName,
        category_id: categoryId || null,
        supplier_id: supplierId,
        packaging: packaging || null,
        minimum_order_quantity: parseInt(minimumOrderQty) || 1,
        unit_price: unitPrice ? parseFloat(unitPrice) : null,
        alert_threshold: parseInt(alertThreshold) || 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from("product_references")
          .update(productData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_references")
          .insert(productData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Référence modifiée" : "Référence créée" });
      queryClient.invalidateQueries({ queryKey: ["product-references"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_references")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Référence supprimée" });
      queryClient.invalidateQueries({ queryKey: ["product-references"] });
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setReferenceCode("");
    setProductName("");
    setCategoryId("");
    setSupplierId("");
    setPackaging("");
    setMinimumOrderQty("1");
    setUnitPrice("");
    setAlertThreshold("0");
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setReferenceCode(product.reference_code);
    setProductName(product.name);
    setCategoryId(product.category_id || "");
    setSupplierId(product.supplier_id);
    setPackaging(product.packaging || "");
    setMinimumOrderQty(product.minimum_order_quantity?.toString() || "1");
    setUnitPrice(product.unit_price?.toString() || "");
    setAlertThreshold(product.alert_threshold?.toString() || "0");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Modifier" : "Nouvelle"} référence produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Code référence *</Label>
              <Input
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="REF-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Nom du produit"
              />
            </div>

            <div className="space-y-2">
              <Label>Fournisseur *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
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
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Optionnel" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conditionnement</Label>
              <Input
                value={packaging}
                onChange={(e) => setPackaging(e.target.value)}
                placeholder="Ex: Carton de 10"
              />
            </div>

            <div className="space-y-2">
              <Label>Qté min. commande</Label>
              <Input
                type="number"
                min="1"
                value={minimumOrderQty}
                onChange={(e) => setMinimumOrderQty(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Prix unitaire (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Seuil d'alerte</Label>
              <Input
                type="number"
                min="0"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Annuler
              </Button>
            )}
            <Button
              onClick={() => saveProduct.mutate()}
              disabled={saveProduct.isPending}
            >
              {saveProduct.isPending ? "Enregistrement..." : editingId ? "Modifier" : "Créer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Références existantes ({products?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Seuil</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.reference_code}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>{product.supplier?.name}</TableCell>
                      <TableCell>
                        {product.unit_price ? `${product.unit_price.toFixed(2)} €` : "-"}
                      </TableCell>
                      <TableCell>{product.current_stock}</TableCell>
                      <TableCell>{product.alert_threshold}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Supprimer cette référence ?")) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune référence. Créez-en une pour commencer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
