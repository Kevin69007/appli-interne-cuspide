import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, User, FileText } from "lucide-react";
import { FichePosteDialog } from "./FichePosteDialog";
import { useEmployeeBadgeSummary } from "@/hooks/useEmployeeBadgeSummary";
import { getEmployeeLevel, getBadgeTierFromCount } from "@/lib/badges";
import { motion } from "framer-motion";

interface Employee {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  equipe: string;
  photo_url: string | null;
  user_id: string | null;
  email: string | null;
  groupe: string | null;
}

export const Trombinoscope = () => {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [groupedEmployees, setGroupedEmployees] = useState<Record<string, Employee[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [fichePosteOpen, setFichePosteOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("equipe", { ascending: true })
        .order("nom", { ascending: true });

      if (error) throw error;

      setEmployees(data || []);
      
      // Grouper par équipe
      const grouped = (data || []).reduce((acc, emp) => {
        const team = emp.equipe || "Sans équipe";
        if (!acc[team]) acc[team] = [];
        acc[team].push(emp);
        return acc;
      }, {} as Record<string, Employee[]>);
      
      setGroupedEmployees(grouped);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (employeeId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${employeeId}/photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('employees')
        .update({ photo_url: publicUrl })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      toast({
        title: "Photo mise à jour",
        description: "La photo a été mise à jour avec succès",
      });
      
      fetchEmployees();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la photo",
        variant: "destructive",
      });
    }
  };

  const handlePhotoDelete = async (employeeId: string, photoUrl: string | null) => {
    if (!photoUrl) return;

    try {
      const filePath = photoUrl.split('/employee-photos/')[1];
      
      const { error: deleteError } = await supabase.storage
        .from('employee-photos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const { error: updateError } = await supabase
        .from('employees')
        .update({ photo_url: null })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      toast({
        title: "Photo supprimée",
        description: "La photo a été supprimée avec succès",
      });
      
      fetchEmployees();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la photo",
        variant: "destructive",
      });
    }
  };

  const canManagePhoto = (employee: Employee) => {
    return isAdmin || isManager || employee.user_id === user?.id;
  };

  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFichePosteOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        {Object.entries(groupedEmployees).map(([team, teamEmployees]) => (
          <div key={team}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {team}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({teamEmployees.length} {teamEmployees.length > 1 ? "membres" : "membre"})
              </span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {teamEmployees.map((employee) => (
                <EmployeeCard 
                  key={employee.id}
                  employee={employee}
                  canManagePhoto={canManagePhoto(employee)}
                  onPhotoUpload={handlePhotoUpload}
                  onPhotoDelete={handlePhotoDelete}
                  onClick={() => handleEmployeeClick(employee)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <FichePosteDialog
        employee={selectedEmployee}
        open={fichePosteOpen}
        onOpenChange={setFichePosteOpen}
        onEmployeeUpdated={fetchEmployees}
      />
    </>
  );
};

// Composant séparé pour la carte employé avec badges
interface EmployeeCardProps {
  employee: Employee;
  canManagePhoto: boolean;
  onPhotoUpload: (employeeId: string, file: File) => void;
  onPhotoDelete: (employeeId: string, photoUrl: string | null) => void;
  onClick: () => void;
}

function EmployeeCard({ employee, canManagePhoto, onPhotoUpload, onPhotoDelete, onClick }: EmployeeCardProps) {
  const { summary, loading } = useEmployeeBadgeSummary(employee.id);
  
  if (loading) {
    return <Card className="p-4"><div className="animate-pulse h-48 bg-muted rounded" /></Card>;
  }

  const totalUnlocked = summary?.total_unique_badges || 0;
  const level = getEmployeeLevel(totalUnlocked);
  
  // Récupérer les 3 derniers badges avec leur tier
  const recentBadges = (summary?.recent_badges || []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative"
        onClick={onClick}
        style={{
          borderWidth: '2px',
          borderColor: level.cardColor.includes('linear-gradient') 
            ? 'transparent' 
            : level.cardColor,
          backgroundImage: level.cardColor.includes('linear-gradient')
            ? level.cardColor
            : undefined,
          backgroundClip: level.cardColor.includes('linear-gradient')
            ? 'padding-box'
            : undefined,
        }}
      >
        {level.glowEffect && (
          <div 
            className="absolute inset-0 opacity-50 blur-xl -z-10"
            style={{
              background: level.cardColor,
            }}
          />
        )}
        
        <CardContent className="p-4 bg-background/95 backdrop-blur">
          {/* Niveau badge */}
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              className="text-xs px-2 py-0.5 font-semibold"
              style={{
                backgroundColor: level.cardColor.includes('linear-gradient') 
                  ? undefined 
                  : level.cardColor,
                backgroundImage: level.cardColor.includes('linear-gradient')
                  ? level.cardColor
                  : undefined,
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {level.emoji} {level.name}
            </Badge>
          </div>

          {/* Mini badges (3 derniers) avec tier */}
          {recentBadges.length > 0 && (
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              {recentBadges.map(badgeData => {
                const tier = getBadgeTierFromCount(badgeData.annual_count);
                return (
                  <div
                    key={badgeData.badge_id}
                    className="w-7 h-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-xs"
                    style={{ borderColor: tier.color, borderWidth: '2px' }}
                    title={`x${badgeData.annual_count} ${tier.emoji}`}
                  >
                    {tier.emoji}
                  </div>
                );
              })}
            </div>
          )}

          <div className="relative aspect-square mb-3 bg-muted rounded-lg overflow-hidden mt-6">
            {employee.photo_url ? (
              <img 
                src={employee.photo_url} 
                alt={`${employee.prenom} ${employee.nom}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            {canManagePhoto && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) onPhotoUpload(employee.id, file);
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                
                {employee.photo_url && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPhotoDelete(employee.id, employee.photo_url);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="outline" className="bg-background/90">
                <FileText className="w-3 h-3 mr-1" />
                Fiche
              </Badge>
            </div>
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-sm">
              {employee.prenom} {employee.nom}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {employee.poste || "Non défini"}
            </p>
            {totalUnlocked > 0 && (
              <p className="text-xs text-primary mt-1 font-medium">
                🏆 {totalUnlocked} badge{totalUnlocked > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
