import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ShoppingCart, Package, Truck, Settings } from "lucide-react";
import { OrdersList } from "@/components/stock/OrdersList";
import { StockView } from "@/components/stock/StockView";
import { SuppliersList } from "@/components/stock/SuppliersList";
import { StockConfig } from "@/components/stock/StockConfig";
import { ModuleHelpButton } from "@/components/communication/ModuleHelpButton";
import { useTranslation } from "react-i18next";

const CommandesStock = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['stock', 'common']);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{t('title')}</h1>
                  <ModuleHelpButton moduleId="stock" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t('orders')}
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2">
              <Package className="h-4 w-4" />
              {t('stock')}
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Truck className="h-4 w-4" />
              {t('suppliers')}
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('configuration')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <OrdersList />
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <StockView />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <SuppliersList />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <StockConfig />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CommandesStock;