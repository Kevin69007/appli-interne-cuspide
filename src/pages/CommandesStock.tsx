import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, FileText, BarChart3, Package, ShoppingCart } from "lucide-react";

const CommandesStock = () => {
  const navigate = useNavigate();

  const LinkCard = ({ 
    title, 
    description, 
    url, 
    icon: Icon 
  }: { 
    title: string; 
    description: string; 
    url: string; 
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Card 
      className="group cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
      onClick={() => window.open(url, '_blank')}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
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
              <ShoppingCart className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Commandes & Stock</h1>
                <p className="text-sm text-muted-foreground">Gérez vos commandes et suivez votre stock</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="commander" className="space-y-6">
          <TabsList>
            <TabsTrigger value="commander">Passer une commande</TabsTrigger>
            <TabsTrigger value="suivre">Suivre les commandes</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="commander" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LinkCard
                title="Commande Ti-base"
                description="Formulaire de commande pour les Ti-base"
                url="https://tally.so/r/wa6XdB"
                icon={FileText}
              />
              <LinkCard
                title="Autres commandes"
                description="Formulaire pour toutes les autres commandes"
                url="https://tally.so/r/31loMM"
                icon={FileText}
              />
            </div>
          </TabsContent>

          <TabsContent value="suivre" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LinkCard
                title="Suivi commande Ti-base"
                description="Tableau de suivi des commandes Ti-base"
                url="https://docs.google.com/spreadsheets/d/1YydZMeTbjzgU0_w8RpmEnsQLwfixuh0WnSBWgKj0atA/edit?gid=894519695#gid=894519695"
                icon={BarChart3}
              />
              <LinkCard
                title="Suivi autre commande"
                description="Tableau de suivi des autres commandes"
                url="https://docs.google.com/spreadsheets/d/12zWOihUFhwScTIUuNuorXabaKx1zK6zpqipmZqG4vGY/edit?gid=1327570281#gid=1327570281"
                icon={BarChart3}
              />
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LinkCard
                title="Stock W usinage"
                description="Tableau de gestion du stock d'usinage"
                url="https://docs.google.com/spreadsheets/d/1RErzJ_GeDoGZ-wjYbIm8Zc6gz-QfHKzGdKrMKggiKXQ/edit?gid=0#gid=0"
                icon={Package}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CommandesStock;
