import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Tag, Settings } from "lucide-react";
import { ProductCategoriesConfig } from "./config/ProductCategoriesConfig";
import { ProductReferencesConfig } from "./config/ProductReferencesConfig";
import { ValidationConfig } from "./config/ValidationConfig";

export const StockConfig = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration</h2>
        <p className="text-muted-foreground">
          Gérez les catégories, références et paramètres
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="references" className="gap-2">
            <Package className="h-4 w-4" />
            Références
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <Settings className="h-4 w-4" />
            Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <ProductCategoriesConfig />
        </TabsContent>

        <TabsContent value="references">
          <ProductReferencesConfig />
        </TabsContent>

        <TabsContent value="validation">
          <ValidationConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};
